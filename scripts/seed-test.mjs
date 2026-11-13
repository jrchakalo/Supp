import fs from 'node:fs';
import path from 'node:path';

/**
 * Idempotent test fixtures for the agenda/library/editor.
 *
 * Dry-run by default:
 *   node scripts/seed-test.mjs
 * Apply:
 *   node scripts/seed-test.mjs --apply
 *
 * It creates one test class, one test content and one planned occurrence for
 * the next Wednesday. Re-running updates the same rows instead of duplicating.
 */

const apply = process.argv.includes('--apply');
const root = process.cwd();
const envFile = path.join(root, '.env.local');
const env = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
const url = (env.match(/^NEXT_PUBLIC_SUPABASE_URL=(.*)$/m) || [])[1]?.trim();
const key = (env.match(/^SUPABASE_SERVICE_ROLE_KEY=(.*)$/m) || [])[1]?.trim();

if (!url || !key) {
  console.error('Defina NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY em .env.local.');
  process.exit(1);
}

const headers = {
  apikey: key,
  authorization: `Bearer ${key}`,
  'content-type': 'application/json',
};

function nextWednesday() {
  const date = new Date();
  date.setHours(12, 0, 0, 0);
  const delta = (3 - date.getDay() + 7) % 7 || 7;
  date.setDate(date.getDate() + delta);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const contentId = 'seed-aula-1';
const segments = [
  {
    id: 'seed-abertura',
    label: 'Abertura',
    minutes: 10,
    talk: ['Aula de teste do seed.'],
    do: ['Confirme que o telão mostra este bloco.'],
    slides: [
      {
        kind: 'big',
        kicker: 'SEED',
        title: 'Aula de teste',
        lines: ['Conteúdo criado pelo seed idempotente.', 'Pode apagar depois.'],
      },
    ],
  },
];
const date = nextWednesday();

const classRow = {
  platform_class_id: 'seed-class-1',
  short_code: 'SEED-C1',
  name: 'Turma de teste',
  discipline: 'coding-1',
  weekday: 3,
  start_time: '10:00:00',
  end_time: '11:40:00',
  room: 'Lab',
  active: true,
};

const contentRow = {
  id: contentId,
  discipline: 'coding-1',
  track: 'Seed',
  book: 'Teste',
  unit_no: 1,
  lesson_no: 1,
  title: 'Aula de teste (seed)',
  total_min: 100,
  deck_id: 'seed',
  segments,
  version: 1,
  status: 'draft',
};

const occurrenceRow = {
  class_id: null,
  content_id: contentId,
  date,
  start_at: `${date}T10:00:00-03:00`,
  end_at: `${date}T11:40:00-03:00`,
  status: 'planned',
  content_version: 1,
};

async function upsert(table, rows, onConflict) {
  const conflict = onConflict.split(',').map(encodeURIComponent).join(',');
  const response = await fetch(`${url}/rest/v1/${table}?on_conflict=${conflict}`, {
    method: 'POST',
    headers: { ...headers, prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!response.ok) throw new Error(`${table}: ${response.status} ${await response.text()}`);
}

async function main() {
  console.log(JSON.stringify({ apply, date, contentId, classRow, occurrenceRow }, null, 2));
  if (!apply) {
    console.log('\nDry-run. Rode com --apply para gravar.');
    return;
  }

  await upsert('pp_classes', [classRow], 'platform_class_id');
  await upsert('pp_content', [contentRow], 'id');
  await upsert(
    'pp_content_versions',
    [
      {
        content_id: contentId,
        version: 1,
        segments,
        title: contentRow.title,
        total_min: contentRow.total_min,
        author: 'seed',
      },
    ],
    'content_id,version'
  );

  const classes = await (
    await fetch(
      `${url}/rest/v1/pp_classes?select=id&platform_class_id=eq.seed-class-1&limit=1`,
      { headers }
    )
  ).json();
  const classId = classes[0]?.id;
  if (!classId) throw new Error('seed class not found after upsert');

  await upsert(
    'pp_occurrences',
    [{ ...occurrenceRow, class_id: classId }],
    'class_id,date,start_at'
  );
  console.log(`Seed aplicado: ${classRow.short_code} em ${date}.`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
