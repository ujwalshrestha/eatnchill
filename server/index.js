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

const uploadsDir = process.env.VERCEL === '1' 
  ? join('/tmp', 'uploads') 
  : join(__dirname, 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('⚠️ Could not create uploads directory:', err.message);
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

// Serve the built frontend anywhere a production bundle is available.
if (process.env.NODE_ENV === 'production') {
  const clientDist = join(__dirname, '..', 'client', 'dist');
  console.log('📦 Serving static files from:', clientDist);
  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    app.get('*', (req, res) => {
      res.sendFile(join(clientDist, 'index.html'));
    });
  } else {
    console.warn('⚠️ Static directory not found:', clientDist);
  }
}

app.use(errorHandler);

// Initialize DB for all environments
try {
  console.log('🔄 Initializing database...');
  await initDatabase();
  console.log('✅ Database connected and initialized');
} catch (err) {
  console.error('❌ Database initialization failed:', err);
  // Do not crash the entire process on initialization error (better for cold starts)
}

if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`\n🍽️  Restaurant API Server running on http://localhost:${PORT}`);
    console.log(`📋 Health check: http://localhost:${PORT}/api/health\n`);
  });
}

export default app;
