import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const env = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/) || [])[1]?.trim();
const key = (env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/) || [])[1]?.trim();

if (!url || !key) {
  console.error('Missing Supabase env vars in .env.local');
  process.exit(1);
}

const tables = [
  'pp_classes',
  'pp_content',
  'pp_content_versions',
  'pp_occurrences',
  'pp_overrides',
  'pp_reports',
  'pp_calendar_rules',
];

let failed = false;
for (const table of tables) {
  const response = await fetch(`${url}/rest/v1/${table}?select=*&limit=1`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (response.ok) {
    const rows = await response.json();
    console.log(`OK   ${table} (sample rows: ${rows.length})`);
  } else {
    failed = true;
    console.log(`FAIL ${table} (${response.status})`);
  }
}

const calendar = await fetch(
  `${url}/rest/v1/pp_calendar_rules?select=weekday,from_date,to_date,kind,label&order=weekday.asc`,
  { headers: { apikey: key, Authorization: `Bearer ${key}` } }
);
if (calendar.ok) {
  const rules = await calendar.json();
  console.log('calendar:', JSON.stringify(rules));
} else {
  failed = true;
  console.log(`FAIL pp_calendar_rules (${calendar.status})`);
}

process.exit(failed ? 1 : 0);
