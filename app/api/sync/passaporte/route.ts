import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { fetchPassaporteSnapshot } from '@/lib/passaporte/client';
import { isProfessorRequest } from '@/lib/auth/session';
import {
  addDaysIso,
  localIso,
  mapClass,
  mapReport,
  reportStatus,
  type ReportRow,
} from '@/lib/passaporte/map';
import { adminSelect, adminUpsert } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type ClassDbRow = {
  id: string;
  platform_class_id: string;
  start_time: string;
  end_time: string;
  weekday: number;
  active: boolean;
};

type OccurrenceDbRow = {
  id: string;
  class_id: string | null;
  date: string;
  start_at: string;
  status: string;
};

type CalendarRule = {
  weekday: number | null;
  date: string | null;
  from_date: string;
  to_date: string | null;
  kind: string;
};

const DEFAULT_OFF_RULES: CalendarRule[] = [
  { weekday: 5, date: null, from_date: '2026-11-01', to_date: null, kind: 'off' },
  { weekday: 0, date: null, from_date: '2026-11-01', to_date: null, kind: 'off' },
];

function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function weekdayOf(date: string): number {
  return new Date(`${date}T12:00:00-03:00`).getUTCDay();
}

function isOff(date: string, rules: CalendarRule[]): boolean {
  const weekday = weekdayOf(date);
  return rules.some((rule) => {
    if (rule.date) return rule.date === date;
    if (rule.weekday !== weekday) return false;
    if (date < rule.from_date) return false;
    return !rule.to_date || date <= rule.to_date;
  });
}

async function authorized(request: NextRequest): Promise<boolean> {
  const secret = process.env.CRON_SECRET;
  const header =
    request.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ??
    request.headers.get('x-cron-secret');

  if (secret && header) {
    const given = Buffer.from(header);
    const expected = Buffer.from(secret);
    if (given.length === expected.length && timingSafeEqual(given, expected)) return true;
  }

  return isProfessorRequest();
}

/* Best-effort in-memory guard: one real sync per 10 s per client. Vercel may
   run several instances, so this complements (not replaces) the secret. */
const lastSyncByClient = new Map<string, number>();
const SYNC_COOLDOWN_MS = 10_000;

function rateLimited(request: NextRequest): boolean {
  const client =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'local';
  const now = Date.now();
  const last = lastSyncByClient.get(client) ?? 0;
  if (now - last < SYNC_COOLDOWN_MS) return true;
  lastSyncByClient.set(client, now);
  if (lastSyncByClient.size > 500) {
    for (const [key, timestamp] of lastSyncByClient) {
      if (now - timestamp > SYNC_COOLDOWN_MS) lastSyncByClient.delete(key);
    }
  }
  return false;
}

async function runSync(request: NextRequest) {
  const url = new URL(request.url);
  const dry = url.searchParams.get('dry') === '1';
  if (!(await authorized(request))) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (!dry && rateLimited(request)) {
    return NextResponse.json({ error: 'rate limited' }, { status: 429 });
  }

  const snapshot = await fetchPassaporteSnapshot();
  const classRows = snapshot.classes.map(mapClass);

  if (dry) {
    return NextResponse.json({
      dry: true,
      classes: classRows.length,
      reports: snapshot.reports.length,
      shortCodes: classRows.map((row) => row.short_code).sort(),
    });
  }

  await adminUpsert('pp_classes', classRows, 'platform_class_id');

  const dbClasses = await adminSelect<ClassDbRow[]>(
    'pp_classes?select=id,platform_class_id,start_time,end_time,weekday,active'
  );
  const classByPlatform = new Map(dbClasses.map((row) => [row.platform_class_id, row]));
  const classById = new Map(dbClasses.map((row) => [row.id, row]));

  const reportRows: Array<ReportRow & { class_id: string | null }> = snapshot.reports.map(
    (report) => {
      const row = mapReport(report);
      return { ...row, class_id: classByPlatform.get(row.platform_class_id)?.id ?? null };
    }
  );
  await adminUpsert('pp_reports', reportRows, 'id');

  const reportOccurrences = reportRows
    .filter((row) => row.class_id && row.class_date)
    .map((row) => {
      const classroom = row.class_id ? classById.get(row.class_id) : null;
      const start = row.start_at ?? localIso(row.class_date, classroom?.start_time ?? '00:00');
      const end = row.end_at ?? localIso(row.class_date, classroom?.end_time ?? '00:00');
      return {
        class_id: row.class_id,
        date: row.class_date,
        start_at: start,
        end_at: end,
        status: reportStatus(row.class_info),
        platform_report_id: row.id,
      };
    });

  await adminUpsert(
    'pp_occurrences',
    reportOccurrences,
    'class_id,date,start_at',
    'merge'
  );

  const existing = await adminSelect<OccurrenceDbRow[]>(
    'pp_occurrences?select=id,class_id,date,start_at,status&limit=2000'
  );
  const seen = new Set(existing.filter((row) => row.class_id).map((row) => `${row.class_id}|${row.date}`));
  for (const row of reportOccurrences) seen.add(`${row.class_id}|${row.date}`);

  let rules = DEFAULT_OFF_RULES;
  try {
    rules = await adminSelect<CalendarRule[]>(
      'pp_calendar_rules?select=weekday,date,from_date,to_date,kind&kind=eq.off'
    );
    if (rules.length === 0) rules = DEFAULT_OFF_RULES;
  } catch {
    /* Table not applied yet: keep the defaults. */
  }

  const today = todayInSaoPaulo();
  const futureSlots: Array<Record<string, unknown>> = [];
  for (const classroom of dbClasses.filter((row) => row.active)) {
    for (let offset = 0; offset <= 14; offset += 1) {
      const date = addDaysIso(today, offset);
      if (weekdayOf(date) !== classroom.weekday) continue;
      if (isOff(date, rules)) continue;
      const key = `${classroom.id}|${date}`;
      if (seen.has(key)) continue;
      futureSlots.push({
        class_id: classroom.id,
        content_id: null,
        date,
        start_at: localIso(date, classroom.start_time),
        end_at: localIso(date, classroom.end_time),
        status: 'unplanned',
      });
      seen.add(key);
    }
  }

  await adminUpsert(
    'pp_occurrences',
    futureSlots,
    'class_id,date,start_at',
    'ignore'
  );

  return NextResponse.json({
    classes: classRows.length,
    reports: reportRows.length,
    given: reportOccurrences.length,
    slots: futureSlots.length,
    today,
  });
}

export async function GET(request: NextRequest) {
  try {
    return await runSync(request);
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    return await runSync(request);
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
