import { Router } from 'express';
import QRCode from 'qrcode';
import { getDb } from '../database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

function normalizeBaseUrl(url) {
  return url ? url.replace(/\/$/, '') : null;
}

function getBaseUrl(req) {
  const configuredUrl = normalizeBaseUrl(process.env.CLIENT_URL);
  if (configuredUrl) return configuredUrl;

  const origin = normalizeBaseUrl(req.get('origin'));
  if (origin) return origin;

  const forwardedHost = req.headers['x-forwarded-host'];
  const host = (Array.isArray(forwardedHost) ? forwardedHost[0] : forwardedHost) || req.get('host');

  if (host === 'localhost:3001' || host === '127.0.0.1:3001') {
    return 'http://localhost:5173';
  }

  const forwardedProto = req.headers['x-forwarded-proto'];
  const proto = (Array.isArray(forwardedProto) ? forwardedProto[0] : forwardedProto) || req.protocol || 'http';

  return normalizeBaseUrl(`${proto}://${host}`) || 'http://localhost:5173';
}

router.get('/qr/all', asyncHandler(async (req, res) => {
  const db = getDb();
  const tables = await db.prepare(`
    SELECT * FROM tables_config
    WHERE is_active = 1
    ORDER BY LENGTH(table_number) ASC, table_number ASC
  `).all();

  const qrCodes = await Promise.all(
    tables.map(async (table) => {
      const url = `${getBaseUrl(req)}/table/${table.id}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 400, margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      return { table_number: table.table_number, seats: table.seats, url, qr_code: qrDataUrl };
    })
  );

  res.json({ success: true, data: qrCodes });
}));

router.get('/settings/session-timeout', asyncHandler(async (req, res) => {
  // Deprecated: Session timeout settings no longer used
  res.json({ success: true, data: { session_timeout_minutes: 15 } });
}));

router.put('/settings/session-timeout', asyncHandler(async (req, res) => {
  // Deprecated: Session timeout settings no longer used
  res.json({ success: true, data: { session_timeout_minutes: 15 } });
}));

router.get('/', asyncHandler(async (req, res) => {
  const db = getDb();
  const tables = await db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM orders o WHERE o.table_id = t.id AND o.status IN ('pending', 'preparing', 'ready')) as active_orders
    FROM tables_config t
    ORDER BY LENGTH(t.table_number) ASC, t.table_number ASC
  `).all();

  res.json({ success: true, data: tables });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const db = getDb();
  const table = await db.prepare('SELECT * FROM tables_config WHERE id = ?').get(parseInt(req.params.id));
  if (!table) throw new AppError('Table not found', 404);

  res.json({ success: true, data: table });
}));

router.post('/', asyncHandler(async (req, res) => {
  const db = getDb();
  const { table_number, seats = 4, is_active = 1 } = req.body;
  if (!table_number || !table_number.trim()) throw new AppError('Table number is required');

  const existing = await db.prepare('SELECT id FROM tables_config WHERE table_number = ?').get(table_number.trim());
  if (existing) throw new AppError('Table number already exists');

  const result = await db.prepare(
    'INSERT INTO tables_config (table_number, seats, is_active) VALUES (?, ?, ?)'
  ).run(table_number.trim(), seats, is_active);

  const table = await db.prepare('SELECT * FROM tables_config WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: table });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const existing = await db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  if (!existing) throw new AppError('Table not found', 404);

  const { table_number, seats, is_active } = req.body;

  if (table_number && table_number.trim() !== existing.table_number) {
    const duplicate = await db.prepare('SELECT id FROM tables_config WHERE table_number = ? AND id != ?').get(table_number.trim(), id);
    if (duplicate) throw new AppError('Table number already exists');
  }

  const updates = [];
  const params = [];
  if (table_number !== undefined) { updates.push('table_number = ?'); params.push(table_number.trim()); }
  if (seats !== undefined) { updates.push('seats = ?'); params.push(seats); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

  if (updates.length > 0) {
    params.push(id);
    await db.prepare(`UPDATE tables_config SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updated = await db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const existing = await db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  if (!existing) throw new AppError('Table not found', 404);

  await db.prepare('DELETE FROM tables_config WHERE id = ?').run(id);
  res.json({ success: true, message: 'Table deleted' });
}));

router.get('/:id/qr', asyncHandler(async (req, res) => {
  const db = getDb();
  const table = await db.prepare('SELECT * FROM tables_config WHERE id = ?').get(parseInt(req.params.id));
  if (!table) throw new AppError('Table not found', 404);

  const url = `${getBaseUrl(req)}/table/${table.id}`;

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 400, margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });

  res.json({
    success: true,
    data: { table_number: table.table_number, url, qr_code: qrDataUrl },
  });
}));

export default router;
