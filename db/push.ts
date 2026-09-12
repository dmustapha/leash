// File: db/push.ts
// [Task 5.4b / DEV-029] Push the index-layer schema (db/init.sql) to the Neon DB. Idempotent - safe to re-run.
// There is no drizzle-kit in deps, so this executes the canonical DDL directly. Run: npx tsx --env-file=.env db/push.ts
import 'dotenv/config';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

async function main(): Promise<void> {
  const sql = readFileSync(join(process.cwd(), 'db', 'init.sql'), 'utf8');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2 });
  await pool.query(sql);
  const t = await pool.query(`select table_name from information_schema.tables where table_schema='public' order by table_name`);
  console.log('schema pushed. tables:', t.rows.map((r) => r.table_name).join(', '));
  await pool.end();
}

main().then(() => process.exit(0)).catch((e) => { console.error('push failed:', e.message); process.exit(1); });
