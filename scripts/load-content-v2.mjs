import fs from 'node:fs';
import path from 'node:path';

/**
 * Loads the reviewed v2 payload into Supabase:
 * - pp_content (canonical lessons)
 * - pp_content_versions (v1)
 * - links each legacy occurrence to content_id/snapshot.
 *
 * The C2-08 P1 A2 snapshot keeps the local "recap" block; the canonical
 * content does not have it.
 */

const root = process.cwd();
const env = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
const url = (env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m) || [])[1]?.trim();
const key = (env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m) || [])[1]?.trim();
if (!url || !key) throw new Error('Missing Supabase env vars');

const payload = JSON.parse(
  fs.readFileSync(
    path.join(root, 'projetos-pasaporte', '_backup-2026-11', 'content-v2.json'),
    'utf8'
  )
);

const headers = {
  apikey: key,
  authorization: `Bearer ${key}`,
  'content-type': 'application/json',
};

async function select(pathname) {
  const response = await fetch(`${url}/rest/v1/${pathname}`, { headers });
  if (!response.ok) throw new Error(`select ${pathname}: ${response.status} ${await response.text()}`);
  return response.json();
}

async function upsert(table, rows, onConflict, resolution = 'merge-duplicates') {
  if (!rows.length) return;
  const conflict = onConflict.split(',').map(encodeURIComponent).join(',');
  const response = await fetch(`${url}/rest/v1/${table}?on_conflict=${conflict}`, {
    method: 'POST',
    headers: {
      ...headers,
      prefer: `resolution=${resolution},return=minimal`,
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`upsert ${table}: ${response.status} ${await response.text()}`);
}

async function patch(id, body) {
  const response = await fetch(`${url}/rest/v1/pp_occurrences?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...headers, prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`patch occurrence ${id}: ${response.status} ${await response.text()}`);
}

const classes = await select('pp_classes?select=id,short_code&limit=200');
const classByCode = new Map(classes.map((row) => [row.short_code, row.id]));

const contents = payload.contents.map((content) => ({
  id: content.id,
  discipline: content.discipline,
  track: content.track,
  book: content.book,
  unit_no: content.unit_no,
  lesson_no: content.lesson_no,
  title: content.title,
  total_min: content.total_min,
  deck_id: content.deck_id,
  segments: content.segments,
  version: content.version ?? 1,
  status: content.status ?? 'published',
}));
await upsert('pp_content', contents, 'id');

const versions = contents.map((content) => ({
  content_id: content.id,
  version: content.version,
  segments: content.segments,
  title: content.title,
  total_min: content.total_min,
  author: 'migration-2026-11',
}));
await upsert('pp_content_versions', versions, 'content_id,version');

const occurrences = await select(
  'pp_occurrences?select=id,class_id,date,start_at,status,content_id&limit=2000'
);
const exact = new Map();
const byDay = new Map();
for (const row of occurrences) {
  if (!row.class_id) continue;
  exact.set(`${row.class_id}|${row.date}|${new Date(row.start_at).toISOString()}`, row);
  const dayKey = `${row.class_id}|${row.date}`;
  if (!byDay.has(dayKey)) byDay.set(dayKey, row);
}

let linked = 0;
const missing = [];
for (const item of payload.occurrences) {
  const classId = classByCode.get(item.class_short_code);
  if (!classId) {
    missing.push(`${item.class_short_code} (class not found)`);
    continue;
  }
  const normalizedStart = new Date(item.start_at).toISOString();
  const row =
    exact.get(`${classId}|${item.date}|${normalizedStart}`) ?? byDay.get(`${classId}|${item.date}`);
  if (!row) {
    missing.push(`${item.class_short_code} ${item.date} ${item.content_id}`);
    continue;
  }

  const body = {
    content_id: item.content_id,
    content_version: item.content_version ?? 1,
    snapshot: item.snapshot ?? null,
  };
  if (item.status === 'planned' && row.status === 'unplanned') body.status = 'planned';
  await patch(row.id, body);
  linked += 1;
}

console.log(`contents: ${contents.length}`);
console.log(`versions: ${versions.length}`);
console.log(`occurrences linked: ${linked}`);
if (missing.length) console.log('missing:', missing.join(' | '));

const c208 = await select(
  'pp_occurrences?select=id,date,content_id,snapshot&content_id=eq.m1c2-p1-a2&limit=10'
);
for (const row of c208) {
  const hasRecap = Array.isArray(row.snapshot)
    ? row.snapshot.some((segment) => segment.id === 'recap')
    : false;
  console.log(`P1 A2 ${row.date}: snapshot=${Boolean(row.snapshot)} recap=${hasRecap}`);
}
