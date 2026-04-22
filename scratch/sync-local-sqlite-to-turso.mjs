import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';
import { createRequire } from 'node:module';

// Resolve deps from `server/node_modules` (repo uses separate server/client installs).
const require = createRequire(new URL('../server/', import.meta.url));
const { createClient } = require('@libsql/client');

const argv = process.argv.slice(2);
const args = new Set(argv);

const WIPE_ALL = args.has('--wipe-all');
const WIPE_MENU = WIPE_ALL || args.has('--wipe-menu');
const PRESERVE_ORDERS = args.has('--preserve-orders') || (!WIPE_ALL && !args.has('--wipe-orders'));
const LOCAL_DB = (() => {
  const idx = argv.indexOf('--local-db');
  if (idx !== -1 && argv[idx + 1] && !argv[idx + 1].startsWith('--')) return argv[idx + 1];
  return 'server/data/restaurant.db';
})();

function usage() {
  console.log(
    [
      'Usage: node scratch/sync-local-sqlite-to-turso.mjs [--wipe-all | --wipe-menu | --preserve-orders] [--local-db path]',
      '',
      'Modes:',
      '- --wipe-all: Deletes live orders + menu tables, then imports menu from local DB (closest to "identical").',
      '- --wipe-menu: Deletes only menu tables (will fail if live has order history referencing food_items).',
      '- --preserve-orders (default): Upserts local menu rows by id and deactivates anything not in local.',
      '',
      'Tip (hide token):',
      "  bash -lc 'stty -echo; node scratch/sync-local-sqlite-to-turso.mjs --wipe-all; stty echo'",
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
  // Ensure tables exist (for a fresh Turso DB).
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
  `);
}

async function fetchAll(client, sql) {
  const res = await client.execute({ sql, args: [] });
  return res.rows.map((r) => {
    const obj = { ...r };
    for (const [k, v] of Object.entries(obj)) {
      if (typeof v === 'bigint') obj[k] = Number(v);
    }
    return obj;
  });
}

async function wipeOrders(client) {
  await client.executeMultiple(`
    DELETE FROM order_item_options;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM sqlite_sequence WHERE name IN ('order_item_options','order_items','orders');
  `);
}

async function wipeMenu(client) {
  await client.executeMultiple(`
    DELETE FROM item_options;
    DELETE FROM food_items;
    DELETE FROM categories;
    DELETE FROM sqlite_sequence WHERE name IN ('item_options','food_items','categories');
  `);
}

async function upsertCategory(client, c) {
  await client.execute({
    sql: `
      INSERT INTO categories (id, name, description, image_url, sort_order, is_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        description=excluded.description,
        image_url=excluded.image_url,
        sort_order=excluded.sort_order,
        is_active=excluded.is_active,
        created_at=excluded.created_at
    `,
    args: [
      c.id,
      c.name,
      c.description ?? '',
      c.image_url ?? '',
      c.sort_order ?? 0,
      c.is_active ?? 1,
      c.created_at ?? null,
    ],
  });
}

async function upsertFoodItem(client, f) {
  await client.execute({
    sql: `
      INSERT INTO food_items (id, category_id, name, description, price, image_url, is_available, sort_order, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        category_id=excluded.category_id,
        name=excluded.name,
        description=excluded.description,
        price=excluded.price,
        image_url=excluded.image_url,
        is_available=excluded.is_available,
        sort_order=excluded.sort_order,
        created_at=excluded.created_at
    `,
    args: [
      f.id,
      f.category_id,
      f.name,
      f.description ?? '',
      Number(f.price) || 0,
      f.image_url ?? '',
      f.is_available ?? 1,
      f.sort_order ?? 0,
      f.created_at ?? null,
    ],
  });
}

async function upsertItemOption(client, o) {
  await client.execute({
    sql: `
      INSERT INTO item_options (id, food_item_id, name, price, is_active)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        food_item_id=excluded.food_item_id,
        name=excluded.name,
        price=excluded.price,
        is_active=excluded.is_active
    `,
    args: [o.id, o.food_item_id, o.name, Number(o.price) || 0, o.is_active ?? 1],
  });
}

async function bumpSequences(client) {
  // Keep AUTOINCREMENT sequences ahead of max(id) to avoid collisions.
  const catMax = (await scalar(client, 'SELECT IFNULL(MAX(id), 0) FROM categories')) || 0;
  const foodMax = (await scalar(client, 'SELECT IFNULL(MAX(id), 0) FROM food_items')) || 0;
  const optMax = (await scalar(client, 'SELECT IFNULL(MAX(id), 0) FROM item_options')) || 0;

  await client.executeMultiple(`
    INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('categories', ${Number(catMax)});
    INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('food_items', ${Number(foodMax)});
    INSERT OR REPLACE INTO sqlite_sequence (name, seq) VALUES ('item_options', ${Number(optMax)});
  `);
}

async function deactivateMissing(client, local) {
  // Ensure customers don’t see “extra” stuff if we keep old rows for order history.
  const localCatIds = new Set(local.categories.map((c) => c.id));
  const localFoodIds = new Set(local.food_items.map((f) => f.id));
  const localOptIds = new Set(local.item_options.map((o) => o.id));

  const liveCats = await fetchAll(client, 'SELECT id FROM categories');
  const liveFood = await fetchAll(client, 'SELECT id FROM food_items');
  const liveOpts = await fetchAll(client, 'SELECT id FROM item_options');

  for (const { id } of liveCats) {
    if (!localCatIds.has(id)) {
      await client.execute({ sql: 'UPDATE categories SET is_active = 0 WHERE id = ?', args: [id] });
    }
  }
  for (const { id } of liveFood) {
    if (!localFoodIds.has(id)) {
      await client.execute({ sql: 'UPDATE food_items SET is_available = 0 WHERE id = ?', args: [id] });
    }
  }
  for (const { id } of liveOpts) {
    if (!localOptIds.has(id)) {
      await client.execute({ sql: 'UPDATE item_options SET is_active = 0 WHERE id = ?', args: [id] });
    }
  }
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

    const localDbPath = path.resolve(LOCAL_DB);
    const local = createClient({ url: `file:${localDbPath}` });
    const turso = createClient({ url, authToken });

    await ensureSchema(turso);

    const localData = {
      categories: await fetchAll(local, 'SELECT * FROM categories ORDER BY id'),
      food_items: await fetchAll(local, 'SELECT * FROM food_items ORDER BY id'),
      item_options: await fetchAll(local, 'SELECT * FROM item_options ORDER BY id'),
    };

    const liveCountsBefore = {
      categories: await scalar(turso, 'SELECT COUNT(*) FROM categories'),
      food_items: await scalar(turso, 'SELECT COUNT(*) FROM food_items'),
      item_options: await scalar(turso, 'SELECT COUNT(*) FROM item_options'),
      orders: await scalar(turso, 'SELECT COUNT(*) FROM orders'),
    };

    if (WIPE_ALL) {
      await wipeOrders(turso);
      await wipeMenu(turso);
    } else if (WIPE_MENU) {
      await wipeMenu(turso);
    }

    // Upsert local rows by id.
    for (const c of localData.categories) await upsertCategory(turso, c);
    for (const f of localData.food_items) await upsertFoodItem(turso, f);
    for (const o of localData.item_options) await upsertItemOption(turso, o);

    if (PRESERVE_ORDERS && !WIPE_MENU && !WIPE_ALL) {
      await deactivateMissing(turso, localData);
    }

    await bumpSequences(turso);

    const liveCountsAfter = {
      categories: await scalar(turso, 'SELECT COUNT(*) FROM categories'),
      food_items: await scalar(turso, 'SELECT COUNT(*) FROM food_items'),
      item_options: await scalar(turso, 'SELECT COUNT(*) FROM item_options'),
      orders: await scalar(turso, 'SELECT COUNT(*) FROM orders'),
    };

    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: WIPE_ALL ? 'wipe-all' : WIPE_MENU ? 'wipe-menu' : 'preserve-orders',
          localDb: localDbPath,
          liveBefore: liveCountsBefore,
          liveAfter: liveCountsAfter,
          localCounts: {
            categories: localData.categories.length,
            food_items: localData.food_items.length,
            item_options: localData.item_options.length,
          },
        },
        null,
        2
      )
    );
  } finally {
    rl.close();
  }
}

main().catch((err) => {
  console.error(JSON.stringify({ ok: false, error: err?.message || String(err) }, null, 2));
  process.exitCode = 1;
});

