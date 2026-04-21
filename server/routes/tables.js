import { Router } from 'express';
import QRCode from 'qrcode';
import { getDb } from '../database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const getBaseUrl = () => process.env.CLIENT_URL || 'http://localhost:5173';

// GET QR codes for ALL tables — must be before /:id to avoid route conflict
router.get('/qr/all', async (req, res) => {
  const db = getDb();
  const tables = db.prepare('SELECT * FROM tables_config WHERE is_active = 1 ORDER BY table_number ASC').all();

  const qrCodes = await Promise.all(
    tables.map(async (table) => {
      const url = `${getBaseUrl()}/table/${table.id}`;
      const qrDataUrl = await QRCode.toDataURL(url, {
        width: 400, margin: 2,
        color: { dark: '#1a1a2e', light: '#ffffff' },
        errorCorrectionLevel: 'H',
      });
      return { table_number: table.table_number, seats: table.seats, url, qr_code: qrDataUrl };
    })
  );

  res.json({ success: true, data: qrCodes });
});

router.get('/', (req, res) => {
  const db = getDb();
  const tables = db.prepare(`
    SELECT t.*,
      (SELECT COUNT(*) FROM orders o WHERE o.table_id = t.id AND o.status IN ('pending', 'preparing')) as active_orders
    FROM tables_config t
    ORDER BY t.table_number ASC
  `).all();
  res.json({ success: true, data: tables });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const table = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(parseInt(req.params.id));
  if (!table) throw new AppError('Table not found', 404);
  res.json({ success: true, data: table });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { table_number, seats = 4, is_active = 1 } = req.body;
  if (!table_number || !table_number.trim()) throw new AppError('Table number is required');

  const existing = db.prepare('SELECT id FROM tables_config WHERE table_number = ?').get(table_number.trim());
  if (existing) throw new AppError('Table number already exists');

  const result = db.prepare(
    'INSERT INTO tables_config (table_number, seats, is_active) VALUES (?, ?, ?)'
  ).run(table_number.trim(), seats, is_active);

  const table = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: table });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  if (!existing) throw new AppError('Table not found', 404);

  const { table_number, seats, is_active } = req.body;

  if (table_number && table_number.trim() !== existing.table_number) {
    const duplicate = db.prepare('SELECT id FROM tables_config WHERE table_number = ? AND id != ?').get(table_number.trim(), id);
    if (duplicate) throw new AppError('Table number already exists');
  }

  const updates = [];
  const params = [];
  if (table_number !== undefined) { updates.push('table_number = ?'); params.push(table_number.trim()); }
  if (seats !== undefined) { updates.push('seats = ?'); params.push(seats); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE tables_config SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updated = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(id);
  if (!existing) throw new AppError('Table not found', 404);

  db.prepare('DELETE FROM tables_config WHERE id = ?').run(id);
  res.json({ success: true, message: 'Table deleted' });
});

router.get('/:id/qr', async (req, res) => {
  const db = getDb();
  const table = db.prepare('SELECT * FROM tables_config WHERE id = ?').get(parseInt(req.params.id));
  if (!table) throw new AppError('Table not found', 404);

  const url = `${getBaseUrl()}/table/${table.id}`;

  const qrDataUrl = await QRCode.toDataURL(url, {
    width: 400, margin: 2,
    color: { dark: '#1a1a2e', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  });

  res.json({
    success: true,
    data: { table_number: table.table_number, url, qr_code: qrDataUrl },
  });
});

export default router;
