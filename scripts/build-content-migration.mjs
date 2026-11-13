import fs from 'node:fs';
import path from 'node:path';

/**
 * Builds the v2 payload (pp_content + pp_occurrences) from the legacy lesson
 * JSONs. It does not write to Supabase; it produces a reviewable JSON file.
 *
 * Rules:
 * - content is canonical and shared;
 * - each legacy lesson becomes one occurrence;
 * - the C2-08 "recap" block is local: the canonical P1 A2 omits it and the
 *   12/11 occurrence snapshot keeps it;
 * - every slide gets a stable id (segmentId:s01).
 */

const root = process.cwd();
const lessonsDir = path.join(root, 'projetos-pasaporte', 'lessons');
const outDir = path.join(root, 'projetos-pasaporte', '_backup-2026-11');
const outFile = path.join(outDir, 'content-v2.json');

const today = '2026-11-13';

function readLessons() {
  return fs
    .readdirSync(lessonsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => JSON.parse(fs.readFileSync(path.join(lessonsDir, file), 'utf8')))
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''));
}

function withSlideIds(segments) {
  return segments.map((segment) => ({
    ...segment,
    slides: (segment.slides ?? []).map((slide, index) => ({
      ...slide,
      id: `${segment.id}:s${String(index + 1).padStart(2, '0')}`,
    })),
  }));
}

function shortCodeFromTurma(turma = '') {
  const head = turma.split('·')[0].trim();
  const info = head.match(/Info(?:rmática)?\s*Bil[íi]ngue\s*(\d+)/i);
  if (info) return `Info ${info[1].padStart(2, '0')}`;
  const teens = head.match(/PSE\s*Teens\s*(\d+)/i);
  if (teens) return `Teens ${teens[1].padStart(2, '0')}`;
  const pse = head.match(/PSE\s*C2-(\d+)/i);
  if (pse) return `PSE C2-${pse[1].padStart(2, '0')}`;
  const c1 = head.match(/C1-(\d+)/i);
  if (c1) return `C1-${c1[1].padStart(2, '0')}`;
  const c2 = head.match(/C2-(\d+)/i);
  if (c2) return `C2-${c2[1].padStart(2, '0')}`;
  return head;
}

function timeRange(turma = '', totalMin = 0) {
  const match = turma.match(/(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/);
  if (match) return { start: match[1].padStart(5, '0'), end: match[2].padStart(5, '0') };
  const startMatch = turma.match(/(\d{1,2}:\d{2})/);
  const start = startMatch ? startMatch[1].padStart(5, '0') : '00:00';
  const [hours, minutes] = start.split(':').map(Number);
  const endMinutes = hours * 60 + minutes + totalMin;
  const end = `${String(Math.floor(endMinutes / 60)).padStart(2, '0')}:${String(endMinutes % 60).padStart(2, '0')}`;
  return { start, end };
}

function contentMeta(id, lesson) {
  const coded = id.match(/^m(\d+)(c[12])-p(\d+)-a(\d+)$/);
  if (coded) {
    return {
      discipline: coded[2] === 'c1' ? 'coding-1' : 'coding-2',
      track: coded[2],
      unit_no: Number(coded[3]),
      lesson_no: Number(coded[4]),
      book: null,
    };
  }
  if (id.startsWith('ib-')) {
    return { discipline: 'info', track: 'info', unit_no: null, lesson_no: null, book: null };
  }
  if (id.startsWith('pse-')) {
    return { discipline: 'pse', track: 'pse', unit_no: null, lesson_no: null, book: null };
  }
  if (id.startsWith('teens-')) {
    return { discipline: 'pse-teens', track: 'teens', unit_no: null, lesson_no: null, book: null };
  }
  return { discipline: 'other', track: null, unit_no: null, lesson_no: null, book: null };
}

const lessons = readLessons();
const canonical = new Map();
const occurrences = [];

for (const lesson of lessons) {
  const fullSegments = withSlideIds(lesson.segments ?? []);
  const meta = contentMeta(lesson.id, lesson);
  const canonicalSegments =
    lesson.id === 'm1c2-p1-a2'
      ? fullSegments.filter((segment) => segment.id !== 'recap')
      : fullSegments;

  if (!canonical.has(lesson.id)) {
    canonical.set(lesson.id, {
      id: lesson.id,
      discipline: meta.discipline,
      track: meta.track,
      book: meta.book,
      unit_no: meta.unit_no,
      lesson_no: meta.lesson_no,
      title: lesson.title,
      total_min: lesson.totalMin,
      deck_id: lesson.deckId || null,
      segments: canonicalSegments,
      version: 1,
      status: 'published',
    });
  }

  const { start, end } = timeRange(lesson.turma, lesson.totalMin);
  const isGiven = lesson.date < today;
  occurrences.push({
    content_id: lesson.id,
    class_short_code: shortCodeFromTurma(lesson.turma),
    date: lesson.date,
    start_at: `${lesson.date}T${start}:00-03:00`,
    end_at: `${lesson.date}T${end}:00-03:00`,
    status: isGiven ? 'given' : 'planned',
    content_version: 1,
    snapshot: isGiven ? fullSegments : null,
    source_turma: lesson.turma,
  });
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(
  outFile,
  JSON.stringify({ contents: [...canonical.values()], occurrences }, null, 2) + '\n',
  'utf8'
);

const recap = canonical.get('m1c2-p1-a2')?.segments.some((segment) => segment.id === 'recap');
const recapOccurrence = occurrences.find(
  (item) => item.content_id === 'm1c2-p1-a2' && item.class_short_code === 'C2-08'
);
console.log(`contents: ${canonical.size}`);
console.log(`occurrences: ${occurrences.length}`);
console.log(`P1 A2 canonical has recap: ${Boolean(recap)}`);
console.log(
  `P1 A2 C2-08 snapshot has recap: ${Boolean(
    recapOccurrence?.snapshot?.some((segment) => segment.id === 'recap')
  )}`
);
console.log(`written: ${outFile}`);
