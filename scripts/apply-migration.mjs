import fs from 'node:fs';
import path from 'node:path';

/**
 * Applies supabase/migrations/20261113_content_model.sql with a direct DB URL.
 * Prefer the Supabase SQL editor if you do not have SUPABASE_DB_URL/pg.
 */
const root = process.cwd();
const envPath = path.join(root, '.env.local');
const env = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
const dbUrl = (env.match(/SUPABASE_DB_URL=(.+)/) || [])[1]?.trim() || process.env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('Missing SUPABASE_DB_URL in .env.local (or environment).');
  console.error('Use the Supabase SQL editor instead: supabase/migrations/README.md');
  process.exit(1);
}

let pg;
try {
  pg = await import('pg');
} catch {
  console.error('The "pg" package is not installed. Run: npm i -D pg');
  process.exit(1);
}

const sql = fs.readFileSync(
  path.join(root, 'supabase', 'migrations', '20261113_content_model.sql'),
  'utf8'
);

const client = new pg.Client({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });
try {
  await client.connect();
  await client.query(sql);
  console.log('Migration applied.');
} finally {
  await client.end();
}
