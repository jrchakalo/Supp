import type { Lesson } from '../passaporte-lessons';

/**
 * Loads the institutional lesson content of `/professor` at runtime from Supabase.
 *
 * The content lives in `pp_plans` (`id`, `meta`, `data`) and never ships in the
 * bundle. This helper is deliberately forgiving: missing env vars, HTTP errors,
 * invalid JSON or a timeout all resolve to `[]` so the screen can show a
 * friendly retry state instead of crashing.
 */

const REQUEST_TIMEOUT_MS = 8000;

export async function fetchLessons(): Promise<Lesson[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return [];

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${url}/rest/v1/pp_plans?select=id,meta,data`, {
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
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
