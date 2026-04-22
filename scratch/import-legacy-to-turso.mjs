import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createRequire } from 'node:module';

import { extractInsertObjects } from '../server/legacySqlParser.js';

// Resolve deps from `server/node_modules` (repo uses separate server/client installs).
const require = createRequire(new URL('../server/', import.meta.url));
const { createClient } = require('@libsql/client');

const args = new Set(process.argv.slice(2));
const WIPE = args.has('--wipe');
const FORCE = args.has('--force');
const DRY_RUN = args.has('--dry-run');
const argv = process.argv.slice(2);

function readArgValue(flag) {
  const idx = argv.indexOf(flag);
  if (idx === -1) return null;
  const v = argv[idx + 1];
  if (!v || v.startsWith('--')) return null;
  return v;
}

const SQL_FILE = readArgValue('--sql-file') || readArgValue('--sql');

function usage() {
  console.log(
    [
      'Usage: node scratch/import-legacy-to-turso.mjs [--dry-run] [--force] [--wipe]',
      '       node scratch/import-legacy-to-turso.mjs --sql-file path/to/dump.sql [--force] [--wipe]',
      '',
      'Defaults:',
      '- Refuses to run if categories already exist (use --force)',
      '- Does not delete anything (use --wipe to replace menu)',
      '',
      'Tip: run with terminal echo disabled so your auth token is not displayed:',
      "  bash -lc 'stty -echo; node scratch/import-legacy-to-turso.mjs --force --wipe; stty echo'",
    ].join('\n')
  );
}

async function scalar(client, sql) {
  const res = await client.execute({ sql, args: [] });
  const first = res.rows[0];
  const value = first ? Object.values(first)[0] : null;
  return typeof value === 'bigint' ? Number(value) : value;
}

async function ensureSchema(client) {
  await client.executeMultiple(`
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
    CREATE TABLE IF NOT EXISTS item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      food_item_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      price REAL DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      FOREIGN KEY (food_item_id) REFERENCES food_items(id) ON DELETE CASCADE
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
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      food_item_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 1,
      unit_price REAL NOT NULL,
      subtotal REAL NOT NULL,
      special_instructions TEXT DEFAULT ''
    );
    CREATE TABLE IF NOT EXISTS order_item_options (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_item_id INTEGER NOT NULL,
      option_id INTEGER,
      name TEXT NOT NULL,
      price REAL NOT NULL
    );
    CREATE TABLE IF NOT EXISTS admin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `);
}

async function wipeData(client) {
  // Wipe in dependency order. Safe when you want the DB to exactly match the dump.
  await client.executeMultiple(`
    DELETE FROM order_item_options;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM item_options;
    DELETE FROM food_items;
    DELETE FROM categories;
    DELETE FROM sqlite_sequence WHERE name IN ('order_item_options','order_items','orders','item_options','food_items','categories');
  `);
}

async function main() {
  if (args.has('-h') || args.has('--help')) {
    usage();
    return;
  }

  const rl = readline.createInterface({ input, output });
  try {
    const url = (process.env.TURSO_DATABASE_URL || (await rl.question('TURSO_DATABASE_URL: '))).trim();
    const authToken = (process.env.TURSO_AUTH_TOKEN || (await rl.question('TURSO_AUTH_TOKEN: '))).trim();

    if (!url) throw new Error('Missing TURSO_DATABASE_URL');
    if (!authToken) throw new Error('Missing TURSO_AUTH_TOKEN');

    const client = createClient({ url, authToken });
    await ensureSchema(client);

    const existingCategories = await scalar(client, 'SELECT COUNT(*) AS cnt FROM categories');
    const existingFood = await scalar(client, 'SELECT COUNT(*) AS cnt FROM food_items');

    if ((existingCategories > 0 || existingFood > 0) && !FORCE) {
      console.log(
        JSON.stringify(
          {
            ok: false,
            message: 'Target DB is not empty. Re-run with --force (and optionally --wipe).',
            existing: { categories: existingCategories, food_items: existingFood },
          },
          null,
          2
        )
      );
      process.exitCode = 2;
      return;
    }

    const sqlPath = SQL_FILE ? path.resolve(SQL_FILE) : path.join(process.cwd(), 'legacy_dump.sql');
    if (!fs.existsSync(sqlPath)) throw new Error(`Missing legacy_dump.sql at ${sqlPath}`);
    const sql = fs.readFileSync(sqlPath, 'utf8');

    const legacyCategories = extractInsertObjects(sql, 'category');
    const legacyProducts = extractInsertObjects(sql, 'product');
    const legacyOptions = extractInsertObjects(sql, 'product_option');
    const legacyAdmin = extractInsertObjects(sql, 'admin_login');

    if (DRY_RUN) {
      console.log(
        JSON.stringify(
          {
            ok: true,
            dryRun: true,
            parsed: {
              categories: legacyCategories.length,
              products: legacyProducts.length,
              options: legacyOptions.length,
              admin_rows: legacyAdmin.length,
            },
          },
          null,
          2
        )
      );
      return;
    }

    if (WIPE) {
      await wipeData(client);
    }

    // Insert admin (first row)
    if (legacyAdmin.length > 0) {
      const username = legacyAdmin[0].username;
      const password = legacyAdmin[0].password;
      if (username && password) {
        await client.execute({
          sql: 'INSERT OR IGNORE INTO admin (username, password) VALUES (?, ?)',
          args: [username, password],
        });
      }
    }

    // Categories mapping old->new
    const catMapping = new Map();
    const catsSorted = [...legacyCategories].sort((a, b) => (Number(a.priority) || 0) - (Number(b.priority) || 0));
    for (const c of catsSorted) {
      if (!c.catname) continue;
      const res = await client.execute({
        sql: 'INSERT INTO categories (name, description, sort_order) VALUES (?, ?, ?)',
        args: [c.catname, '', Number(c.priority) || 0],
      });
      const newId = Number(res.lastInsertRowid);
      catMapping.set(String(c.categoryid), newId);
    }

    let uncategorizedId = null;
    const productMapping = new Map();

    // Food items
    for (const p of legacyProducts) {
      const name = p.productname;
      if (!name) continue;
      let catId = catMapping.get(String(p.categoryid));
      if (!catId) {
        if (!uncategorizedId) {
          const u = await client.execute({
            sql: "INSERT INTO categories (name, description, sort_order) VALUES ('UNCATEGORIZED', 'Legacy items without valid categories', 999)",
            args: [],
          });
          uncategorizedId = Number(u.lastInsertRowid);
        }
        catId = uncategorizedId;
      }

      const res = await client.execute({
        sql: 'INSERT INTO food_items (category_id, name, description, price, image_url, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        args: [
          catId,
          name,
          p.description || '',
          Number(p.price) || 0,
          p.photo || '',
          0,
        ],
      });
      productMapping.set(String(p.productid), Number(res.lastInsertRowid));
    }

    // Options
    for (const o of legacyOptions) {
      const foodId = productMapping.get(String(o.product_id));
      if (!foodId) continue;
      if (!o.choice) continue;
      await client.execute({
        sql: 'INSERT INTO item_options (food_item_id, name, price) VALUES (?, ?, ?)',
        args: [foodId, o.choice, Number(o.price) || 0],
      });
    }

    const counts = {
      categories: await scalar(client, 'SELECT COUNT(*) AS cnt FROM categories'),
      food_items: await scalar(client, 'SELECT COUNT(*) AS cnt FROM food_items'),
      item_options: await scalar(client, 'SELECT COUNT(*) AS cnt FROM item_options'),
      orders: await scalar(client, 'SELECT COUNT(*) AS cnt FROM orders'),
    };

    console.log(JSON.stringify({ ok: true, imported: counts }, null, 2));
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err?.message || String(err) }, null, 2));
  process.exitCode = 1;
});
