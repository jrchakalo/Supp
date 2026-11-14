import type { AgendaData } from './types';
import { classOccursOn } from './calendar';

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

/** Loads everything the dashboard/agenda needs in one round of queries. */
export async function fetchAgendaData(): Promise<AgendaData> {
  const [occurrences, classes, rules, contents] = await Promise.all([
    select<AgendaData['occurrences'][number]>(
      'pp_occurrences?select=id,class_id,content_id,date,start_at,end_at,status,platform_report_id&order=date.asc,start_at.asc&limit=1000'
    ),
    select<AgendaData['classes'][number]>(
      'pp_classes?select=id,short_code,name,discipline,weekday,start_time,end_time,room&limit=200'
    ),
    select<AgendaData['rules'][number]>(
      'pp_calendar_rules?select=weekday,date,from_date,to_date,kind,label&limit=200'
    ),
    select<AgendaData['contents'][number]>('pp_content?select=id,title&limit=200'),
  ]);

  const codeById = new Map(classes.map((row) => [row.id, row.short_code]));
  const visible = occurrences.filter((occurrence) => {
    if (!occurrence.class_id) return true;
    if (occurrence.status !== 'planned' && occurrence.status !== 'unplanned') return true;
    const code = codeById.get(occurrence.class_id);
    return code ? classOccursOn(code, occurrence.date) : true;
  });

  return { occurrences: visible, classes, rules, contents };
}
