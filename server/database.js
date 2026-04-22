import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { DEFAULT_SESSION_TIMEOUT_MINUTES } from './sessionService.js';
import { extractInsertObjects } from './legacySqlParser.js';
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let wrapper = null;

class DBWrapper {
  constructor(client) {
    this._db = client;
  }

  prepare(sql) {
    const self = this;
    return {
      async run(...params) {
        try {
          const res = await self._db.execute({ sql, args: params });
          return { lastInsertRowid: Number(res.lastInsertRowid), changes: res.rowsAffected };
        } catch (err) {
          console.error(`❌ SQL Error in run: ${sql}`, err, params);
          throw err;
        }
      },
      async get(...params) {
        const res = await self._db.execute({ sql, args: params });
        return res.rows.length > 0 ? res.rows[0] : undefined;
      },
      async all(...params) {
        const res = await self._db.execute({ sql, args: params });
        return res.rows;
      }
    };
  }

  async exec(sqlStatements) {
    return await this._db.executeMultiple(sqlStatements);
  }

  async transaction(fn) {
    const tx = await this._db.transaction('write');
    const txWrapper = new DBWrapper(tx);
    try {
      const result = await fn(txWrapper);
      await tx.commit();
      return result;
    } catch (e) {
      console.error('❌ Transaction Error:', e);
      try { await tx.rollback(); } catch (err) {}
      throw e;
    }
  }
}

export async function initDatabase() {
  const localDbPath = process.env.VERCEL === '1'
    ? join('/tmp', 'restaurant.db')
    : join(__dirname, 'data', 'restaurant.db');
  const url = process.env.TURSO_DATABASE_URL || `file:${localDbPath}`;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url.startsWith('file:')) {
    const dbPath = url.slice('file:'.length);
    const dbDir = dirname(dbPath);
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }
  }

  const client = createClient({ url, authToken });
  wrapper = new DBWrapper(client);

  await wrapper.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS food_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      price REAL NOT NULL DEFAULT 0,
      image_url TEXT DEFAULT '',
      is_available INTEGER DEFAULT 1,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS tables_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL UNIQUE,
      seats INTEGER DEFAULT 4,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS table_sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      status TEXT DEFAULT 'active',
      started_at TEXT DEFAULT (datetime('now')),
      last_activity_at TEXT DEFAULT (datetime('now')),
      expires_at TEXT NOT NULL,
      closed_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (table_id) REFERENCES tables_config(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      session_id INTEGER,
      status TEXT DEFAULT 'pending',
      total_amount REAL DEFAULT 0,
      customer_name TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (table_id) REFERENCES tables_config(id),
      FOREIGN KEY (session_id) REFERENCES table_sessions(id)
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      food_item_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      special_instructions TEXT DEFAULT '',
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (food_item_id) REFERENCES food_items(id)
    );
    CREATE TABLE IF NOT EXISTS item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_item_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS order_item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id INTEGER NOT NULL,
      option_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_table_sessions_table_status ON table_sessions(table_id, status);
  `);

  const orderColumns = await wrapper.prepare('PRAGMA table_info(orders)').all();
  if (!orderColumns.some((column) => column.name === 'session_id')) {
    await wrapper.exec('ALTER TABLE orders ADD COLUMN session_id INTEGER;');
  }

  await wrapper.exec('CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);');

  await wrapper.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value)
    VALUES (?, ?)
  `).run('session_timeout_minutes', String(DEFAULT_SESSION_TIMEOUT_MINUTES));

  console.log('✅ Database initialized using @libsql/client');
  await seedDemoData();

  return wrapper;
}

// --- Legacy Data Migration ---
async function seedFromLegacySQL() {
  const tursoUrl = process.env.TURSO_DATABASE_URL || '';
  const isTurso = Boolean(tursoUrl) && !tursoUrl.startsWith('file:');
  const shouldSkipHeavySeedOnVercel = process.env.VERCEL === '1' && isTurso && process.env.LEGACY_SEED_ON_START !== '1';

  const sqlPath = process.env.LEGACY_SQL_PATH
    ? join(__dirname, '..', process.env.LEGACY_SQL_PATH)
    : join(__dirname, '..', 'legacy_dump.sql');
  if (!fs.existsSync(sqlPath)) return;

  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('📖 Parsing legacy_dump.sql...');

  const legacyCategories = [
    ...extractInsertObjects(sql, 'category'),
    ...extractInsertObjects(sql, 'categories'),
  ];
  const legacyProducts = [
    ...extractInsertObjects(sql, 'product'),
    ...extractInsertObjects(sql, 'products'),
  ];
  const legacyOptions = [
    ...extractInsertObjects(sql, 'product_option'),
    ...extractInsertObjects(sql, 'product_variants'),
  ];
  const legacyAdmin = extractInsertObjects(sql, 'admin_login');

  const adminQuery = await wrapper.prepare('SELECT COUNT(*) as cnt FROM admin').get();
  if (adminQuery.cnt === 0 && legacyAdmin.length > 0) {
    const username = legacyAdmin[0].username || legacyAdmin[0].user || legacyAdmin[0].user_name;
    const password = legacyAdmin[0].password;
    await wrapper.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run(username, password);
    console.log(`✅ Admin credentials set: ${username}`);
  }

  const catQuery = await wrapper.prepare('SELECT COUNT(*) as cnt FROM categories').get();
  if (catQuery.cnt > 0) return; 

  if (shouldSkipHeavySeedOnVercel) {
    console.log('⏭️ Skipping legacy SQL import on Vercel (set LEGACY_SEED_ON_START=1 to enable).');
    return;
  }

  const legacyCatMapping = {}; 
  for (const row of legacyCategories) {
    const c_id = row.categoryid ?? row.id ?? row.category_id;
    const name = row.catname ?? row.name ?? row.category_name;
    const sortOrder = row.priority ?? row.sort_order ?? 0;

    if (!name) continue;

    const res = await wrapper.prepare(
      'INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)'
    ).run(name, '', parseInt(sortOrder, 10) || 0);
    legacyCatMapping[c_id] = res.lastInsertRowid;
  }
  console.log(`✅ Imported ${legacyCategories.length} categories.`);

  let uncategorizedId = null;
  const productOldToNewId = {};

  for (const row of legacyProducts) {
    const p_id = row.productid ?? row.id ?? row.product_id;
    const cat_id = row.categoryid ?? row.category_id ?? row.cat_id;
    const title = row.productname ?? row.name ?? row.title;
    const info = row.description ?? row.info ?? '';
    const price = row.price ?? '0';
    const img = row.photo ?? row.image ?? row.image_url ?? '';

    if (!title) continue;

    let newCatId = legacyCatMapping[cat_id];

    if (!newCatId) {
      if (!uncategorizedId) {
        const uCat = await wrapper.prepare("INSERT INTO categories (name, description) VALUES ('UNCATEGORIZED', 'Legacy items without valid categories')").run();
        uncategorizedId = uCat.lastInsertRowid;
      }
      newCatId = uncategorizedId;
    }

    const priceVal = parseFloat(price) || 0;
    const res = await wrapper.prepare(
      'INSERT INTO food_items (category_id, name, description, price, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)'
    ).run(newCatId, title, info || '', priceVal, img || '', 0);
    
    productOldToNewId[p_id] = res.lastInsertRowid;
  }
  console.log(`✅ Imported ${legacyProducts.length} products.`);

  for (const row of legacyOptions) {
    const prod_id = row.product_id ?? row.productid ?? row.food_item_id;
    const title = row.choice ?? row.title ?? row.name;
    const priceStr = row.price ?? '0';
    const newProdId = productOldToNewId[prod_id];
    if (newProdId && title) {
      const optPrice = parseFloat(priceStr) || 0;
      await wrapper.prepare('INSERT INTO item_options (food_item_id, name, price) VALUES (?, ?, ?)').run(newProdId, title, optPrice);
    }
  }
  console.log(`✅ Imported ${legacyOptions.length} options.`);
}

async function seedDemoData() {
  await seedFromLegacySQL();

  let insertedTables = 0;
  for (let i = 1; i <= 19; i++) {
    const result = await wrapper.prepare(
      'INSERT OR IGNORE INTO tables_config (table_number, seats) VALUES (?, ?)'
    ).run(`T${i}`, 4);
    insertedTables += result.changes || 0;
  }

  if (insertedTables > 0) {
    console.log(`✅ Added ${insertedTables} missing default tables.`);
  }

  const adminQuery = await wrapper.prepare('SELECT COUNT(*) as cnt FROM admin').get();
  if (adminQuery.cnt === 0) {
    await wrapper.prepare("INSERT INTO admin (username, password) VALUES ('eatnchill', 'Nepal@123')").run();
    console.log('✅ Default admin seeded.');
  }
}

export function getDb() {
  if (!wrapper) throw new Error('Database not initialized');
  return wrapper;
}
