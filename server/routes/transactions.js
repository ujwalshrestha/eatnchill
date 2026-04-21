import { Router } from 'express';
import { getDb } from '../database.js';

const router = Router();

router.get('/daily', (req, res) => {
  const db = getDb();
  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  const summary = db.prepare(`
    SELECT
      COUNT(*) as total_orders,
      COALESCE(SUM(total_amount), 0) as total_revenue,
      COALESCE(AVG(total_amount), 0) as avg_order_value,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_orders,
      COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_orders,
      COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_orders,
      COUNT(CASE WHEN status = 'preparing' THEN 1 END) as preparing_orders
    FROM orders
    WHERE date(created_at) = date(?)
  `).get(targetDate);

  const categoryBreakdown = db.prepare(`
    SELECT
      c.name as category_name,
      SUM(oi.quantity) as items_sold,
      SUM(oi.subtotal) as revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN food_items f ON f.id = oi.food_item_id
    JOIN categories c ON c.id = f.category_id
    WHERE date(o.created_at) = date(?)
    GROUP BY c.id
    ORDER BY revenue DESC
  `).all(targetDate);

  const tableBreakdown = db.prepare(`
    SELECT
      t.table_number,
      COUNT(o.id) as order_count,
      SUM(o.total_amount) as revenue
    FROM orders o
    JOIN tables_config t ON t.id = o.table_id
    WHERE date(o.created_at) = date(?)
    GROUP BY o.table_id
    ORDER BY revenue DESC
  `).all(targetDate);

  const topItems = db.prepare(`
    SELECT
      f.name,
      f.price,
      SUM(oi.quantity) as total_sold,
      SUM(oi.subtotal) as total_revenue
    FROM order_items oi
    JOIN orders o ON o.id = oi.order_id
    JOIN food_items f ON f.id = oi.food_item_id
    WHERE date(o.created_at) = date(?)
    GROUP BY oi.food_item_id
    ORDER BY total_sold DESC
    LIMIT 10
  `).all(targetDate);

  const hourlyBreakdown = db.prepare(`
    SELECT
      strftime('%H', created_at) as hour,
      COUNT(*) as order_count,
      SUM(total_amount) as revenue
    FROM orders
    WHERE date(created_at) = date(?)
    GROUP BY strftime('%H', created_at)
    ORDER BY hour ASC
  `).all(targetDate);

  const orders = db.prepare(`
    SELECT o.*, t.table_number
    FROM orders o
    LEFT JOIN tables_config t ON t.id = o.table_id
    WHERE date(o.created_at) = date(?)
    ORDER BY o.created_at DESC
  `).all(targetDate);

  res.json({
    success: true,
    data: { date: targetDate, summary, categoryBreakdown, tableBreakdown, topItems, hourlyBreakdown, orders },
  });
});

router.get('/range', (req, res) => {
  const db = getDb();
  const { start_date, end_date } = req.query;
  if (!start_date || !end_date) {
    return res.status(400).json({ success: false, error: 'start_date and end_date are required' });
  }

  const dailySummaries = db.prepare(`
    SELECT
      date(created_at) as date,
      COUNT(*) as total_orders,
      SUM(total_amount) as total_revenue,
      AVG(total_amount) as avg_order_value
    FROM orders
    WHERE date(created_at) BETWEEN date(?) AND date(?)
    GROUP BY date(created_at)
    ORDER BY date ASC
  `).all(start_date, end_date);

  res.json({ success: true, data: dailySummaries });
});

export default router;
