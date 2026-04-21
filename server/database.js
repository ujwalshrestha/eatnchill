import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'data', 'restaurant.db');
const dataDir = join(__dirname, 'data');

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
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
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
