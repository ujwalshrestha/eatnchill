import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { createRequire } from "node:module";

// Resolve deps from `server/node_modules` (repo uses separate server/client installs).
const require = createRequire(new URL("../server/", import.meta.url));
const { createClient } = require("@libsql/client");

const rl = readline.createInterface({ input, output });

try {
  const url = (await rl.question("TURSO_DATABASE_URL: ")).trim();
  const authToken = (await rl.question("TURSO_AUTH_TOKEN: ")).trim();

  if (!url) throw new Error("Missing TURSO_DATABASE_URL");
  if (!authToken) throw new Error("Missing TURSO_AUTH_TOKEN");

  const client = createClient({ url, authToken });

  async function scalar(sql) {
    try {
      const res = await client.execute({ sql, args: [] });
      const first = res.rows[0];
      const value = first ? Object.values(first)[0] : null;
      return typeof value === "bigint" ? Number(value) : value;
    } catch (e) {
      return null;
    }
  }

  const tablesRes = await client.execute({
    sql: "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
    args: [],
  });
  const tables = tablesRes.rows.map((r) => r.name);

  const fingerprint = {
    tables,
    categories: await scalar("SELECT COUNT(*) AS count FROM categories"),
    food_items: await scalar("SELECT COUNT(*) AS count FROM food_items"),
    item_options: await scalar("SELECT COUNT(*) AS count FROM item_options"),
    orders: await scalar("SELECT COUNT(*) AS count FROM orders"),
    sample_category: await scalar("SELECT name AS name FROM categories ORDER BY id ASC LIMIT 1"),
    sample_item: await scalar("SELECT name AS name FROM food_items ORDER BY id ASC LIMIT 1"),
  };

  console.log(JSON.stringify({ ok: true, fingerprint }, null, 2));
} catch (err) {
  console.error(JSON.stringify({ ok: false, error: err?.message || String(err) }, null, 2));
  process.exitCode = 1;
} finally {
  rl.close();
}
