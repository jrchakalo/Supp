import type { Lesson, Segment } from '../passaporte-lessons';
import { CONTENT_MODEL } from '../flags';

/**
 * Loads the institutional lesson content of `/professor` at runtime from
 * Supabase. The v2 model reads an occurrence (class + date) and resolves either
 * its frozen snapshot or the canonical content. The legacy model reads
 * `pp_plans` until the migration is complete.
 */

const REQUEST_TIMEOUT_MS = 8000;
const WEEKDAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

type OccurrenceRow = {
  id: string;
  class_id: string | null;
  content_id: string | null;
  date: string;
  start_at: string;
  end_at: string;
  status: string;
  snapshot: Segment[] | null;
  content_version: number | null;
};

type ContentRow = {
  id: string;
  title: string;
  total_min: number | null;
  deck_id: string | null;
  segments: Segment[];
};

type ClassRow = {
  id: string;
  short_code: string;
  weekday: number;
  start_time: string;
  end_time: string;
};

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? { url, key } : null;
}

async function supabaseGet<T>(path: string): Promise<T[]> {
  const config = env();
  if (!config) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${config.url}/rest/v1/${path}`, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });
    if (!response.ok) return [];
    const rows: unknown = await response.json();
    return Array.isArray(rows) ? (rows as T[]) : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

function lessonMinutes(startAt: string, endAt: string): number {
  const start = new Date(startAt).getTime();
  const end = new Date(endAt).getTime();
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return 0;
  return Math.round((end - start) / 60_000);
}

function localHm(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatTurma(occurrence: OccurrenceRow, classroom?: ClassRow): string {
  if (!classroom) return `Avulsa · ${localHm(occurrence.start_at)}–${localHm(occurrence.end_at)}`;
  return `${classroom.short_code} · ${WEEKDAYS[classroom.weekday] ?? ''} ${classroom.start_time.slice(0, 5)}–${classroom.end_time.slice(0, 5)}`;
}

async function fetchV2Lessons(): Promise<Lesson[]> {
  const [occurrences, contents, classes] = await Promise.all([
    supabaseGet<OccurrenceRow>(
      'pp_occurrences?select=id,class_id,content_id,date,start_at,end_at,status,snapshot,content_version&content_id=not.is.null&order=date.asc'
    ),
    supabaseGet<ContentRow>(
      'pp_content?select=id,title,total_min,deck_id,segments&status=eq.published'
    ),
    supabaseGet<ClassRow>('pp_classes?select=id,short_code,weekday,start_time,end_time'),
  ]);

  if (occurrences.length === 0 || contents.length === 0) return [];

  const contentById = new Map(contents.map((row) => [row.id, row]));
  const classById = new Map(classes.map((row) => [row.id, row]));

  const lessons: Lesson[] = [];
  for (const occurrence of occurrences) {
    if (!occurrence.content_id) continue;
    const content = contentById.get(occurrence.content_id);
    if (!content) continue;
    const classroom = occurrence.class_id ? classById.get(occurrence.class_id) : undefined;
    const segments = Array.isArray(occurrence.snapshot)
      ? occurrence.snapshot
      : content.segments;

    lessons.push({
      id: occurrence.id,
      occurrenceId: occurrence.id,
      classId: occurrence.class_id,
      contentId: content.id,
      status: occurrence.status,
      deckId: content.deck_id ?? '',
      title: content.title,
      turma: formatTurma(occurrence, classroom),
      date: occurrence.date,
      totalMin: content.total_min ?? lessonMinutes(occurrence.start_at, occurrence.end_at),
      segments,
    });
  }

  return lessons;
}

async function fetchLegacyLessons(): Promise<Lesson[]> {
  const config = env();
  if (!config) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${config.url}/rest/v1/pp_plans?select=id,meta,data`, {
      headers: {
        apikey: config.key,
        Authorization: `Bearer ${config.key}`,
        Accept: 'application/json',
      },
      signal: controller.signal,
      cache: 'no-store',
    });

    if (!response.ok) return [];

    const rows: unknown = await response.json();
    if (!Array.isArray(rows)) return [];

    const lessons: Lesson[] = [];
    for (const row of rows) {
      if (!row || typeof row !== 'object') continue;
      const { id, data } = row as { id?: unknown; data?: unknown };
      if (!data || typeof data !== 'object') continue;
      lessons.push({ ...(data as Lesson), id: String(id) });
    }

    return lessons;
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchLessons(): Promise<Lesson[]> {
  if (CONTENT_MODEL === 'v2') {
    const v2 = await fetchV2Lessons();
    if (v2.length > 0) return v2;
    /* Migration not ready or Supabase unavailable: keep the app usable. */
  }
  return fetchLegacyLessons();
}
