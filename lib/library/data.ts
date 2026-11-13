import type { Segment } from '@/lib/passaporte-lessons';

export type LibraryContent = {
  id: string;
  title: string;
  discipline: string;
  track: string | null;
  unit_no: number | null;
  lesson_no: number | null;
  total_min: number | null;
  deck_id: string | null;
  segments: Segment[];
  version: number;
  status: string;
};

export type LibraryClass = {
  id: string;
  short_code: string;
  name: string;
  discipline: string;
  weekday: number;
  start_time: string;
  end_time: string;
};

export type LibraryData = {
  contents: LibraryContent[];
  classes: LibraryClass[];
};

const REQUEST_TIMEOUT_MS = 8000;

async function select<T>(path: string): Promise<T[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${url}/rest/v1/${path}`, {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
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

export async function fetchLibraryData(): Promise<LibraryData> {
  const [contents, classes] = await Promise.all([
    select<LibraryContent>(
      'pp_content?select=id,title,discipline,track,unit_no,lesson_no,total_min,deck_id,segments,version,status&status=eq.published&order=discipline.asc,track.asc,unit_no.asc,lesson_no.asc&limit=300'
    ),
    select<LibraryClass>(
      'pp_classes?select=id,short_code,name,discipline,weekday,start_time,end_time&order=short_code.asc&limit=200'
    ),
  ]);
  return { contents, classes };
}
