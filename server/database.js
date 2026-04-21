import { createClient } from '@libsql/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
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
  const url = process.env.TURSO_DATABASE_URL || `file:${join(__dirname, 'data', 'restaurant.db')}`;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (url.startsWith('file:') && !fs.existsSync(join(__dirname, 'data'))) {
    fs.mkdirSync(join(__dirname, 'data'), { recursive: true });
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
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      total_amount REAL DEFAULT 0,
      customer_name TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (table_id) REFERENCES tables_config(id)
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
  `);

  console.log('✅ Database initialized using @libsql/client');
  await seedDemoData();

  return wrapper;
}

// --- Legacy Data Migration ---
async function seedFromLegacySQL() {
  const sqlPath = join(__dirname, '..', 'legacy_dump.sql');
  if (!fs.existsSync(sqlPath)) return;

  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('📖 Parsing legacy_dump.sql...');

  function getInsertValues(tableName) {
    const regex = new RegExp(`INSERT INTO \`${tableName}\` \\([^)]+\\) VALUES\\s+([\\s\\S]+?);`, 'gi');
    let match;
    const allRows = [];

    while ((match = regex.exec(sql)) !== null) {
      const valuesStr = match[1].trim();
      let currentRow = "";
      let inString = false;
      let parenDepth = 0;

      for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        if (char === "'" && valuesStr[i - 1] !== "\\") inString = !inString;
        if (!inString) {
          if (char === "(") parenDepth++;
          if (char === ")") parenDepth--;
        }
        currentRow += char;
        if (!inString && parenDepth === 0 && (char === "," || i === valuesStr.length - 1)) {
          let cleaned = currentRow.trim();
          if (cleaned.endsWith(',')) cleaned = cleaned.slice(0, -1).trim();
          if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            allRows.push(parseRow(cleaned.slice(1, -1)));
          }
          currentRow = "";
        }
      }
    }
    return allRows;
  }

  function parseRow(rowStr) {
    const cols = [];
    let cur = "";
    let inStr = false;
    for (let i = 0; i < rowStr.length; i++) {
      const c = rowStr[i];
      if (c === "'" && rowStr[i - 1] !== "\\") inStr = !inStr;
      else if (c === "," && !inStr) {
        cols.push(cur.trim());
        cur = "";
        continue;
      }
      cur += c;
    }
    cols.push(cur.trim());
    return cols.map(c => c.replace(/^'|'$/g, '').replace(/\\'/g, "'"));
  }

  const legacyCategories = getInsertValues('categories');
  const legacyProducts = getInsertValues('products');
  const legacyOptions = getInsertValues('product_variants');
  const legacyAdmin = getInsertValues('admin_login');

  const adminQuery = await wrapper.prepare('SELECT COUNT(*) as cnt FROM admin').get();
  if (adminQuery.cnt === 0 && legacyAdmin.length > 0) {
    const [id, username, password] = legacyAdmin[0];
    await wrapper.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run(username, password);
    console.log(`✅ Admin credentials set: ${username}`);
  }

  const catQuery = await wrapper.prepare('SELECT COUNT(*) as cnt FROM categories').get();
  if (catQuery.cnt > 0) return; 

  const legacyCatMapping = {}; 
  for (const row of legacyCategories) {
    const [c_id, image, name, parent] = row;
    const res = await wrapper.prepare('INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)').run(name, '', 0);
    legacyCatMapping[c_id] = res.lastInsertRowid;
  }
  console.log(`✅ Imported ${legacyCategories.length} categories.`);

  let uncategorizedId = null;
  const productOldToNewId = {};

  for (const row of legacyProducts) {
    const [p_id, title, img, price, code, info, cat_id] = row;
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
    ).run(newCatId, title, info || '', priceVal, '', 0);
    
    productOldToNewId[p_id] = res.lastInsertRowid;
  }
  console.log(`✅ Imported ${legacyProducts.length} products.`);

  for (const row of legacyOptions) {
    const [v_id, prod_id, title, priceStr] = row;
    const newProdId = productOldToNewId[prod_id];
    if (newProdId) {
      const optPrice = parseFloat(priceStr) || 0;
      await wrapper.prepare('INSERT INTO item_options (food_item_id, name, price) VALUES (?, ?, ?)').run(newProdId, title, optPrice);
    }
  }
  console.log(`✅ Imported ${legacyOptions.length} options.`);
}

async function seedDemoData() {
  await seedFromLegacySQL();

  const count = await wrapper.prepare('SELECT COUNT(*) as cnt FROM tables_config').get();
  if (count && count.cnt === 0) {
    for (let i = 1; i <= 6; i++) {
       await wrapper.prepare('INSERT INTO tables_config (table_number, seats) VALUES (?, ?)').run(`T${i}`, 4);
    }
    console.log('✅ Default tables seeded.');
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
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_DIR = process.env.DB_DIRECTORY || join(__dirname, 'data');
const DB_PATH = join(DB_DIR, 'restaurant.db');

let wrapper = null;

function saveDatabase() {
  if (!wrapper) return;
  const data = wrapper._db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

setInterval(saveDatabase, 5000);

class DBWrapper {
  constructor(sqlDb) {
    this._db = sqlDb;
  }

  prepare(sql) {
    const self = this;
    return {
      run(...params) {
        try {
          self._db.run(sql, params);
          const r = self._db.exec('SELECT last_insert_rowid()');
          const lastId = r[0].values[0][0];
          const changes = self._db.getRowsModified();
          return { lastInsertRowid: lastId, changes };
        } catch (err) {
          console.error(`❌ SQL Error in run: ${sql}`, err);
          throw err;
        }
      },
      get(...params) {
        const stmt = self._db.prepare(sql);
        if (params.length) stmt.bind(params);
        if (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          stmt.free();
          const row = {};
          cols.forEach((c, i) => (row[c] = vals[i]));
          return row;
        }
        stmt.free();
        return undefined;
      },
      all(...params) {
        const results = [];
        const stmt = self._db.prepare(sql);
        if (params.length) stmt.bind(params);
        while (stmt.step()) {
          const cols = stmt.getColumnNames();
          const vals = stmt.get();
          const row = {};
          cols.forEach((c, i) => (row[c] = vals[i]));
          results.push(row);
        }
        stmt.free();
        return results;
      },
    };
  }

  exec(sql) {
    return this._db.exec(sql);
  }

  transaction(fn) {
    return (...args) => {
      this._db.run('BEGIN TRANSACTION');
      try {
        const result = fn(...args);
        this._db.run('COMMIT');
        saveDatabase();
        return result;
      } catch (e) {
        console.error('❌ Transaction Error:', e);
        try {
          this._db.run('ROLLBACK');
        } catch (rollbackErr) {
          console.error('❌ Rollback failed (likely no active transaction):', rollbackErr.message);
        }
        throw e;
      }
    };
  }
}

export async function initDatabase() {
  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buffer = fs.readFileSync(DB_PATH);
    wrapper = new DBWrapper(new SQL.Database(buffer));
  } else {
    wrapper = new DBWrapper(new SQL.Database());
  }

  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      image_url TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  wrapper.exec(`
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
    )
  `);
  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS tables_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_number TEXT NOT NULL UNIQUE,
      seats INTEGER DEFAULT 4,
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);
  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_id INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      total_amount REAL DEFAULT 0,
      customer_name TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (table_id) REFERENCES tables_config(id)
    )
  `);
  wrapper.exec(`
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
    )
  `);
  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_item_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
    )
  `);
  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS order_item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id INTEGER NOT NULL,
      option_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_item_id) REFERENCES order_items(id) ON DELETE CASCADE
    )
  `);
  wrapper.exec(`
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    )
  `);

  console.log('✅ Database initialized');
  seedDemoData();
  saveDatabase();

  return wrapper;
}

// --- Legacy Data Migration ---
function seedFromLegacySQL() {
  const sqlPath = join(__dirname, '..', 'legacy_dump.sql');
  if (!fs.existsSync(sqlPath)) {
    console.log('⚠️ legacy_dump.sql not found at ' + sqlPath + '. Skipping migration.');
    return;
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');
  console.log('📖 Parsing legacy_dump.sql...');

  function getInsertValues(tableName) {
    const regex = new RegExp(`INSERT INTO \`${tableName}\` \\([^)]+\\) VALUES\\s+([\\s\\S]+?);`, 'gi');
    let match;
    const allRows = [];

    while ((match = regex.exec(sql)) !== null) {
      const valuesStr = match[1].trim();
      let currentRow = "";
      let inString = false;
      let parenDepth = 0;

      for (let i = 0; i < valuesStr.length; i++) {
        const char = valuesStr[i];
        if (char === "'" && valuesStr[i - 1] !== "\\") inString = !inString;
        if (!inString) {
          if (char === "(") parenDepth++;
          if (char === ")") parenDepth--;
        }
        currentRow += char;
        if (!inString && parenDepth === 0 && (char === "," || i === valuesStr.length - 1)) {
          let cleaned = currentRow.trim();
          if (cleaned.endsWith(',')) cleaned = cleaned.slice(0, -1).trim();
          if (cleaned.startsWith('(') && cleaned.endsWith(')')) {
            allRows.push(parseRow(cleaned.slice(1, -1)));
          }
          currentRow = "";
        }
      }
    }
    return allRows;
  }

  function parseRow(rowStr) {
    const values = [];
    let currentVal = "";
    let inString = false;
    for (let i = 0; i < rowStr.length; i++) {
      const char = rowStr[i];
      if (char === "'" && rowStr[i - 1] !== "\\") inString = !inString;
      if (!inString && char === ",") {
        values.push(cleanVal(currentVal));
        currentVal = "";
      } else {
        currentVal += char;
      }
    }
    values.push(cleanVal(currentVal));
    return values;
  }

  function cleanVal(v) {
    v = v.trim();
    if (v === "NULL") return null;
    if (v.startsWith("'") && v.endsWith("'")) {
      return v.slice(1, -1).replace(/\\'/g, "'").replace(/\\r/g, "\r").replace(/\\n/g, "\n").replace(/\\"/g, '"');
    }
    return isNaN(v) ? v : Number(v);
  }

  const db = getDb();

  // 1. Categories
  const categoryRows = getInsertValues('category');
  const catMap = new Map();
  categoryRows.forEach(row => {
    // row: [categoryid, catname, priority]
    const info = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run(row[1], row[2]);
    catMap.set(row[0], info.lastInsertRowid);
  });
  console.log(`✅ Imported ${categoryRows.length} categories.`);

  // 2. Products
  const productRows = getInsertValues('product');
  const prodMap = new Map();
  let uncategorizedId = null;

  productRows.forEach(row => {
    // row: [productid, categoryid, productname, description, note, price, old_price, photo]
    let catId = catMap.get(row[1]);
    
    if (!catId) {
      // Create 'UNCATEGORIZED' if not already created
      if (!uncategorizedId) {
        const info = db.prepare('INSERT INTO categories (name, sort_order) VALUES (?, ?)').run('UNCATEGORIZED', 99);
        uncategorizedId = info.lastInsertRowid;
      }
      catId = uncategorizedId;
    }

    const info = db.prepare('INSERT INTO food_items (category_id, name, price, description) VALUES (?, ?, ?, ?)').run(
      catId, row[2], row[5], row[3] || ""
    );
    prodMap.set(row[0], info.lastInsertRowid);
  });
  console.log(`✅ Imported ${productRows.length} products.`);

  // 3. Product Options
  const optionRows = getInsertValues('product_option');
  optionRows.forEach(row => {
    // row: [id, product_id, choice, price]
    const foodId = prodMap.get(row[1]);
    if (foodId) {
      db.prepare('INSERT INTO item_options (food_item_id, name, price) VALUES (?, ?, ?)').run(
        foodId, row[2], row[3]
      );
    }
  });
  console.log(`✅ Imported ${optionRows.length} options.`);

  // 4. Admin Login
  const adminRows = getInsertValues('admin_login');
  if (adminRows.length > 0) {
    const row = adminRows[0];
    db.prepare('DELETE FROM admin').run();
    db.prepare('INSERT INTO admin (username, password) VALUES (?, ?)').run(row[1], row[2]);
    console.log(`✅ Admin credentials set: ${row[1]}`);
  }
}

function seedDemoData() {
  const db = getDb();
  console.log('🌱 Seeding Eat N Chill Legacy Data...');

  db.transaction(() => {
    // Clear existing data
    db.exec('DELETE FROM order_item_options');
    db.exec('DELETE FROM order_items');
    db.exec('DELETE FROM orders');
    db.exec('DELETE FROM item_options');
    db.exec('DELETE FROM food_items');
    db.exec('DELETE FROM categories');
    db.exec('DELETE FROM tables_config');
    db.exec('DELETE FROM admin');

    // Tables
    ['T1', 'T2', 'T3', 'T4', 'T5', 'T11', 'T12'].forEach((num) => {
      db.prepare('INSERT INTO tables_config (table_number, seats) VALUES (?, ?)').run(num, 2);
    });
    
    seedFromLegacySQL();
  })();
  
  saveDatabase();
}

export function getDb() {
  if (!wrapper) throw new Error('Database not initialized. Call initDatabase() first.');
  return wrapper;
}
