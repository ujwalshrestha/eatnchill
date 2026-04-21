import { Router } from 'express';
import { getDb } from '../database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', (req, res) => {
  const db = getDb();
  const { available_only } = req.query;
  const where = available_only === 'true' ? 'WHERE f.is_available = 1 AND c.is_active = 1' : '';
  
  const items = db.prepare(`
    SELECT f.*, c.name as category_name 
    FROM food_items f
    JOIN categories c ON f.category_id = c.id
    ${where}
    ORDER BY c.sort_order ASC, f.sort_order ASC
  `).all();

  // Attach options to each item
  const itemsWithOptions = items.map(item => {
    const options = db.prepare('SELECT * FROM item_options WHERE food_item_id = ? AND is_active = 1').all(item.id);
    return { ...item, options };
  });

  res.json({ success: true, data: itemsWithOptions });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const item = db.prepare('SELECT * FROM food_items WHERE id = ?').get(parseInt(req.params.id));
  if (!item) throw new AppError('Item not found', 404);
  
  const options = db.prepare('SELECT * FROM item_options WHERE food_item_id = ?').all(item.id);
  res.json({ success: true, data: { ...item, options } });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { category_id, name, description, price, image_url, is_available = 1, sort_order = 0, options = [] } = req.body;
  
  if (!category_id || !name || price === undefined) throw new AppError('Category, name and price are required');

  const result = db.prepare(
    'INSERT INTO food_items (category_id, name, description, price, image_url, is_available, sort_order) VALUES (?, ?, ?, ?, ?, ?, ?)'
  ).run(category_id, name, description, price, image_url, is_available, sort_order);

  const itemId = result.lastInsertRowid;

  // Save options if provided
  if (options && options.length > 0) {
    const stmt = db.prepare('INSERT INTO item_options (food_item_id, name, price) VALUES (?, ?, ?)');
    options.forEach(opt => stmt.run(itemId, opt.name, opt.price || 0));
  }

  const newItem = db.prepare('SELECT * FROM food_items WHERE id = ?').get(itemId);
  res.status(201).json({ success: true, data: newItem });
});

router.put('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT id FROM food_items WHERE id = ?').get(id);
  if (!existing) throw new AppError('Item not found', 404);

  const { category_id, name, description, price, image_url, is_available, sort_order, options } = req.body;
  
  const updates = [];
  const params = [];
  if (category_id !== undefined) { updates.push('category_id = ?'); params.push(category_id); }
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (price !== undefined) { updates.push('price = ?'); params.push(price); }
  if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
  if (is_available !== undefined) { updates.push('is_available = ?'); params.push(is_available); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }

  if (updates.length > 0) {
    params.push(id);
    db.prepare(`UPDATE food_items SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  // Handle options update (simple sync: delete and re-add for this demo)
  if (options !== undefined) {
    db.prepare('DELETE FROM item_options WHERE food_item_id = ?').run(id);
    const stmt = db.prepare('INSERT INTO item_options (food_item_id, name, price, is_active) VALUES (?, ?, ?, ?)');
    options.forEach(opt => stmt.run(id, opt.name, opt.price || 0, opt.is_active !== undefined ? opt.is_active : 1));
  }

  const updated = db.prepare('SELECT * FROM food_items WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
});

router.delete('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  db.prepare('DELETE FROM food_items WHERE id = ?').run(id);
  res.json({ success: true, message: 'Item deleted' });
});

export default router;
