import { Router } from 'express';
import { getDb } from '../database.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const db = getDb();
  const categories = await db.prepare(`
    SELECT c.*, 
      (SELECT COUNT(*) FROM food_items f WHERE f.category_id = c.id) as item_count
    FROM categories c
    ORDER BY c.sort_order ASC, c.created_at ASC
  `).all();
  res.json({ success: true, data: categories });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const db = getDb();
  const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(parseInt(req.params.id));
  if (!category) throw new AppError('Category not found', 404);
  res.json({ success: true, data: category });
}));

router.post('/', asyncHandler(async (req, res) => {
  const db = getDb();
  const { name, description = '', image_url = '', sort_order = 0, is_active = 1 } = req.body;
  if (!name || !name.trim()) throw new AppError('Category name is required');

  const result = await db.prepare(
    'INSERT INTO categories (name, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?)'
  ).run(name.trim(), description, image_url, sort_order, is_active);

  const category = await db.prepare('SELECT * FROM categories WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ success: true, data: category });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const existing = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) throw new AppError('Category not found', 404);

  const { name, description, image_url, sort_order, is_active } = req.body;

  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (image_url !== undefined) { updates.push('image_url = ?'); params.push(image_url); }
  if (sort_order !== undefined) { updates.push('sort_order = ?'); params.push(sort_order); }
  if (is_active !== undefined) { updates.push('is_active = ?'); params.push(is_active); }

  if (updates.length > 0) {
    params.push(id);
    await db.prepare(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }

  const updated = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  res.json({ success: true, data: updated });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const existing = await db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) throw new AppError('Category not found', 404);

  await db.prepare('DELETE FROM food_items WHERE category_id = ?').run(id);
  await db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ success: true, message: 'Category deleted' });
}));

export default router;
