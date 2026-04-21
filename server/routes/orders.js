import { Router } from 'express';
import { getDb } from '../database.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const sseClients = new Set();

export function broadcastOrder(order) {
  const data = JSON.stringify(order);
  for (const client of sseClients) {
    client.write(`data: ${data}\n\n`);
  }
}

router.get('/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  });
  res.write('\n');
  sseClients.add(res);
  req.on('close', () => { sseClients.delete(res); });
});

router.get('/', (req, res) => {
  const db = getDb();
  const { status, table_id, date, limit = 50 } = req.query;

  let query = 'SELECT o.*, t.table_number FROM orders o LEFT JOIN tables_config t ON t.id = o.table_id';
  const conditions = [];
  const params = [];

  if (status) { conditions.push('o.status = ?'); params.push(status); }
  if (table_id) { conditions.push('o.table_id = ?'); params.push(parseInt(table_id)); }
  if (date) { conditions.push("date(o.created_at) = date(?)"); params.push(date); }

  if (conditions.length > 0) query += ' WHERE ' + conditions.join(' AND ');
  query += ' ORDER BY o.created_at DESC LIMIT ?';
  params.push(parseInt(limit));

  const orders = db.prepare(query).all(...params);

  // Fetch items for each order
  const ordersWithItems = orders.map(order => {
    const items = db.prepare(`
      SELECT oi.*, f.name, f.image_url
      FROM order_items oi LEFT JOIN food_items f ON f.id = oi.food_item_id
      WHERE oi.order_id = ?
    `).all(order.id);
    return { ...order, items };
  });

  res.json({ success: true, data: ordersWithItems });
});

router.get('/:id', (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id);
  const order = db.prepare('SELECT o.*, t.table_number FROM orders o LEFT JOIN tables_config t ON t.id = o.table_id WHERE o.id = ?').get(id);
  if (!order) throw new AppError('Order not found', 404);

  const items = db.prepare(`
    SELECT oi.*, f.name, f.image_url
    FROM order_items oi LEFT JOIN food_items f ON f.id = oi.food_item_id
    WHERE oi.order_id = ?
  `).all(id);

  res.json({ success: true, data: { ...order, items } });
});

router.post('/', (req, res) => {
  const db = getDb();
  const { table_id, customer_name = '', notes = '', items } = req.body;

  if (!table_id) throw new AppError('Table ID is required');
  if (!items || !Array.isArray(items) || items.length === 0) throw new AppError('At least one item is required');

  if (items.length === 0) throw new AppError('No items in order');

  const orderResult = db.transaction(() => {
    // 1. Create order
    const result = db.prepare(
      'INSERT INTO orders (table_id, customer_name, notes, status) VALUES (?, ?, ?, ?)'
    ).run(table_id, customer_name, notes, 'pending');
    
    const orderId = result.lastInsertRowid;
    let totalAmount = 0;

    // 2. Add items and their options
    for (const item of items) {
      const foodItem = db.prepare('SELECT * FROM food_items WHERE id = ?').get(item.food_item_id);
      if (!foodItem) throw new AppError(`Item ${item.food_item_id} not found`);

      // Calculate subtotal including options
      let itemUnitPrice = foodItem.price;
      const selectedOptions = item.options || [];
      const optionDetails = [];

      for (const optId of selectedOptions) {
        const option = db.prepare('SELECT * FROM item_options WHERE id = ? AND food_item_id = ?').get(optId, item.food_item_id);
        if (option) {
          itemUnitPrice += option.price;
          optionDetails.push(option);
        }
      }

      const subtotal = itemUnitPrice * item.quantity;
      totalAmount += subtotal;

      const itemInsert = db.prepare(
        'INSERT INTO order_items (order_id, food_item_id, quantity, unit_price, subtotal, special_instructions) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(orderId, item.food_item_id, item.quantity, itemUnitPrice, subtotal, item.special_instructions || '');

      const orderItemId = itemInsert.lastInsertRowid;

      // Save selected options snapshots
      for (const opt of optionDetails) {
        db.prepare(
          'INSERT INTO order_item_options (order_item_id, option_id, name, price) VALUES (?, ?, ?, ?)'
        ).run(orderItemId, opt.id, opt.name, opt.price);
      }
    }

    // 3. Update total order amount
    db.prepare('UPDATE orders SET total_amount = ? WHERE id = ?').run(totalAmount, orderId);

    // 4. Get table number for broadcasting
    const table = db.prepare('SELECT table_number FROM tables_config WHERE id = ?').get(table_id);

    return { orderId, tableNumber: table?.table_number, totalAmount };
  })();

  const newOrder = db.prepare('SELECT * FROM orders WHERE id = ?').get(orderResult.orderId);
  const itemsWithDetails = getOrderItemsWithDetails(orderResult.orderId);
  
  const fullOrder = { ...newOrder, table_number: orderResult.tableNumber, items: itemsWithDetails };

  broadcastOrder({ type: 'new_order', order: fullOrder });
  res.status(201).json({ success: true, data: fullOrder });
});

function getOrderItemsWithDetails(orderId) {
  const db = getDb();
  const items = db.prepare(`
    SELECT oi.*, f.name, f.image_url 
    FROM order_items oi
    JOIN food_items f ON oi.food_item_id = f.id
    WHERE oi.order_id = ?
  `).all(orderId);

  return items.map(item => {
    const options = db.prepare('SELECT * FROM order_item_options WHERE order_item_id = ?').all(item.id);
    return { ...item, options };
  });
}

router.put('/:id/status', (req, res) => {
  const db = getDb();
  const { status } = req.body;
  const validStatuses = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

  if (!status || !validStatuses.includes(status)) throw new AppError(`Status must be one of: ${validStatuses.join(', ')}`);

  const id = parseInt(req.params.id);
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) throw new AppError('Order not found', 404);

  db.prepare("UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);

  const updated = db.prepare('SELECT o.*, t.table_number FROM orders o LEFT JOIN tables_config t ON t.id = o.table_id WHERE o.id = ?').get(id);
  broadcastOrder({ type: 'status_update', order: updated });

  res.json({ success: true, data: updated });
});

export default router;
