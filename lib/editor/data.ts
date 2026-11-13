import type { Segment } from '@/lib/passaporte-lessons';

export type EditorContent = {
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
};

export type EditorOccurrence = {
  id: string;
  class_id: string | null;
  date: string;
  start_at: string;
  end_at: string;
  status: string;
  content_id: string | null;
  snapshot: Segment[] | null;
};

export type EditorClass = {
  id: string;
  short_code: string;
  name: string;
  weekday: number;
};

export type EditorData = {
  content: EditorContent;
  occurrences: EditorOccurrence[];
  classes: EditorClass[];
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

export async function fetchEditorData(contentId: string): Promise<EditorData | null> {
  const [contents, occurrences, classes] = await Promise.all([
    select<EditorContent>(
      `pp_content?select=id,title,discipline,track,unit_no,lesson_no,total_min,deck_id,segments,version&id=eq.${encodeURIComponent(contentId)}&limit=1`
    ),
    select<EditorOccurrence>(
      `pp_occurrences?select=id,class_id,date,start_at,end_at,status,content_id,snapshot&content_id=eq.${encodeURIComponent(contentId)}&order=date.asc&limit=200`
    ),
    select<EditorClass>('pp_classes?select=id,short_code,name,weekday&limit=200'),
  ]);
  if (!contents[0]) return null;
  return { content: contents[0], occurrences, classes };
}
