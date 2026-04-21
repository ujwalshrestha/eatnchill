import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

import { initDatabase } from './database.js';
import { errorHandler } from './middleware/errorHandler.js';
import categoriesRouter from './routes/categories.js';
import foodItemsRouter from './routes/foodItems.js';
import tablesRouter from './routes/tables.js';
import ordersRouter from './routes/orders.js';
import transactionsRouter from './routes/transactions.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const uploadsDir = join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// API Routes
app.use('/api/categories', categoriesRouter);
app.use('/api/food-items', foodItemsRouter);
app.use('/api/tables', tablesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/transactions', transactionsRouter);

app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'Restaurant API is running 🍽️', timestamp: new Date().toISOString() });
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = join(__dirname, '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(join(clientDist, 'index.html'));
  });
}

app.use(errorHandler);

// Initialize DB for all environments (Top-level await)
try {
  await initDatabase();
  console.log('✅ Database connected and initialized');
} catch (err) {
  console.error('❌ Database initialization failed:', err);
}

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n🍽️  Restaurant API Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
