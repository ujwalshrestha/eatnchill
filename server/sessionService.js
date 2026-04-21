import { AppError } from './middleware/errorHandler.js';

export const DEFAULT_SESSION_TIMEOUT_MINUTES = 15;
const ACTIVE_ORDER_STATUSES = ['pending', 'preparing', 'ready'];

function toIsoString(date) {
  return date.toISOString();
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + (minutes * 60 * 1000));
}

function isExpired(session) {
  return !session?.expires_at || new Date(session.expires_at).getTime() <= Date.now();
}

async function countOpenOrders(db, sessionId) {
  const placeholders = ACTIVE_ORDER_STATUSES.map(() => '?').join(', ');
  const row = await db.prepare(
    `SELECT COUNT(*) as count FROM orders WHERE session_id = ? AND status IN (${placeholders})`
  ).get(sessionId, ...ACTIVE_ORDER_STATUSES);
  return row?.count || 0;
}

export async function getSessionTimeoutMinutes(db) {
  const row = await db.prepare('SELECT value FROM app_settings WHERE key = ?').get('session_timeout_minutes');
  const parsed = parseInt(row?.value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_SESSION_TIMEOUT_MINUTES;
}

export async function setSessionTimeoutMinutes(db, minutes) {
  const safeMinutes = parseInt(minutes, 10);
  if (!Number.isFinite(safeMinutes) || safeMinutes < 1 || safeMinutes > 240) {
    throw new AppError('Session timeout must be between 1 and 240 minutes');
  }

  await db.prepare(`
    INSERT INTO app_settings (key, value, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
  `).run('session_timeout_minutes', String(safeMinutes), toIsoString(new Date()));

  return safeMinutes;
}

export async function closeSession(db, sessionId, status = 'closed') {
  const now = toIsoString(new Date());
  await db.prepare(`
    UPDATE table_sessions
    SET status = ?, closed_at = ?, expires_at = ?, updated_at = ?
    WHERE id = ?
  `).run(status, now, now, now, sessionId);
}

export async function touchSession(db, sessionId) {
  const timeoutMinutes = await getSessionTimeoutMinutes(db);
  const now = new Date();
  const expiresAt = addMinutes(now, timeoutMinutes);

  await db.prepare(`
    UPDATE table_sessions
    SET last_activity_at = ?, expires_at = ?, updated_at = ?
    WHERE id = ?
  `).run(toIsoString(now), toIsoString(expiresAt), toIsoString(now), sessionId);

  return db.prepare('SELECT * FROM table_sessions WHERE id = ?').get(sessionId);
}

export async function getCurrentSessionForTable(db, tableId) {
  const session = await db.prepare(`
    SELECT * FROM table_sessions
    WHERE table_id = ? AND status = 'active'
    ORDER BY id DESC
    LIMIT 1
  `).get(tableId);

  if (!session) return null;
  if (!isExpired(session)) return session;

  const openOrders = await countOpenOrders(db, session.id);
  if (openOrders > 0) {
    return touchSession(db, session.id);
  }

  await closeSession(db, session.id, 'expired');
  return null;
}

export async function cleanupExpiredSessions(db) {
  const sessions = await db.prepare(`
    SELECT * FROM table_sessions
    WHERE status = 'active'
    ORDER BY id ASC
  `).all();

  for (const session of sessions) {
    if (!isExpired(session)) continue;
    const openOrders = await countOpenOrders(db, session.id);
    if (openOrders === 0) {
      await closeSession(db, session.id, 'expired');
    }
  }
}

export async function ensureTableSession(db, tableId) {
  const table = await db.prepare('SELECT * FROM tables_config WHERE id = ?').get(tableId);
  if (!table) throw new AppError('Table not found', 404);
  if (!table.is_active) throw new AppError('This table is currently inactive.', 409);

  const currentSession = await getCurrentSessionForTable(db, tableId);
  const timeoutMinutes = await getSessionTimeoutMinutes(db);
  if (currentSession) {
    return { session: currentSession, timeoutMinutes, created: false };
  }

  const now = new Date();
  const expiresAt = addMinutes(now, timeoutMinutes);
  const nowIso = toIsoString(now);

  const result = await db.prepare(`
    INSERT INTO table_sessions (
      table_id, status, started_at, last_activity_at, expires_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(tableId, 'active', nowIso, nowIso, toIsoString(expiresAt), nowIso, nowIso);

  const session = await db.prepare('SELECT * FROM table_sessions WHERE id = ?').get(result.lastInsertRowid);
  return { session, timeoutMinutes, created: true };
}

export async function validateSessionForTable(db, sessionId, tableId) {
  const session = await db.prepare('SELECT * FROM table_sessions WHERE id = ?').get(sessionId);
  if (!session || session.table_id !== tableId) {
    throw new AppError('Table session not found', 404);
  }

  if (session.status !== 'active') {
    throw new AppError('This table session has ended. Please refresh to continue.', 409);
  }

  if (!isExpired(session)) return session;

  const openOrders = await countOpenOrders(db, session.id);
  if (openOrders > 0) {
    return touchSession(db, session.id);
  }

  await closeSession(db, session.id, 'expired');
  throw new AppError('This table session expired. Please refresh to start a new session.', 409);
}
