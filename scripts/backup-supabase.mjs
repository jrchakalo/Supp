import fs from 'node:fs';
import path from 'node:path';

/**
 * One-off backup of the institutional data before the v2 content model.
 * Reads .env.local (never committed) and writes under projetos-pasaporte/.
 */
const root = process.cwd();
const env = fs.readFileSync(path.join(root, '.env.local'), 'utf8');
const url = (env.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/) || [])[1]?.trim();
const serviceKey = (env.match(/SUPABASE_SERVICE_ROLE_KEY=(.+)/) || [])[1]?.trim();

if (!url || !serviceKey) {
  console.error('Missing Supabase env vars in .env.local');
  process.exit(1);
}

const outDir = path.join(root, 'projetos-pasaporte', '_backup-2026-11');
const dbDir = path.join(outDir, 'db');
fs.mkdirSync(dbDir, { recursive: true });

const tables = ['pp_plans', 'pp_quizzes', 'pp_agenda', 'pp_meta'];
const summary = [];

for (const table of tables) {
  const response = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}` },
  });
  if (!response.ok) {
    summary.push(`${table}: ERROR ${response.status}`);
    continue;
  }
  const rows = await response.json();
  const file = path.join(dbDir, `${table}.json`);
  fs.writeFileSync(file, JSON.stringify(rows, null, 2) + '\n', 'utf8');
  summary.push(`${table}: ${rows.length} rows`);
}

const lessonsSrc = path.join(root, 'projetos-pasaporte', 'lessons');
const lessonsDst = path.join(outDir, 'lessons');
if (fs.existsSync(lessonsSrc)) {
  fs.cpSync(lessonsSrc, lessonsDst, { recursive: true });
  summary.push(`lessons: ${fs.readdirSync(lessonsDst).filter((f) => f.endsWith('.json')).length} files`);
}

fs.writeFileSync(
  path.join(outDir, 'README.md'),
  `# Backup 2026-11\n\nGerado antes da migração do modelo de conteúdo.\n\n${summary
    .map((line) => `- ${line}`)
    .join('\n')}\n`,
  'utf8'
);

console.log(summary.join('\n'));
console.log(`Backup em ${outDir}`);
