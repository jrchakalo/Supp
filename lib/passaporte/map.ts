import type { PassaporteClass, PassaporteReport } from './client';

export type ClassRow = {
  platform_class_id: string;
  short_code: string;
  name: string;
  discipline: string;
  weekday: number;
  start_time: string;
  end_time: string;
  room: string | null;
  students_count: number | null;
  current_book: string | null;
  current_unit: string | null;
  last_report_at: string | null;
  active: boolean;
  platform: PassaporteClass;
  synced_at: string;
};

export type ReportRow = {
  id: string;
  platform_class_id: string;
  class_date: string;
  start_at: string | null;
  end_at: string | null;
  class_info: string;
  summary: string;
  raw: PassaporteReport;
  fetched_at: string;
};

const WEEKDAYS: Record<string, number> = {
  domingo: 0,
  'segunda-feira': 1,
  segunda: 1,
  'terca-feira': 2,
  terca: 2,
  'quarta-feira': 3,
  quarta: 3,
  'quinta-feira': 4,
  quinta: 4,
  'sexta-feira': 5,
  sexta: 5,
  sabado: 6,
};

function stripAccents(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

export function weekdayFromName(day: string): number {
  return WEEKDAYS[stripAccents(day).toLowerCase()] ?? 1;
}

export function shortCodeFromName(name: string): string {
  const normalized = stripAccents(name).replace(/\s+/g, ' ').trim();

  const info = normalized.match(/Informatica bilingue\s*(\d+)/i);
  if (info) return `Info ${info[1].padStart(2, '0')}`;

  const teens = normalized.match(/PSE\s*-?\s*Teens\s*(\d+)/i);
  if (teens) return `Teens ${teens[1].padStart(2, '0')}`;

  const pse = normalized.match(/PSE.*Coding II\s*(\d+)/i);
  if (pse) return `PSE C2-${pse[1].padStart(2, '0')}`;

  const c2 = normalized.match(/Coding II\s*-?\s*(\d+)/i);
  if (c2) return `C2-${c2[1].padStart(2, '0')}`;

  const c1 = normalized.match(/Coding I(?!I)\s*-?\s*(\d+)/i);
  if (c1) return `C1-${c1[1].padStart(2, '0')}`;

  return normalized
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 12)
    .toUpperCase();
}

export function disciplineFromName(name: string): string {
  const normalized = stripAccents(name);
  if (/PSE\s*-?\s*Teens/i.test(normalized)) return 'pse-teens';
  if (/\bPSE\b/i.test(normalized)) return 'pse';
  if (/Coding I(?!I)/i.test(normalized)) return 'coding-1';
  if (/Coding II/i.test(normalized)) return 'coding-2';
  if (/Informatica bilingue/i.test(normalized)) return 'info';
  return 'other';
}

/** Platform timestamps look like local time but carry a `Z`; rebuild as -03:00. */
export function localIsoFromPlatform(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  if (!match) return null;
  return `${match[1]}T${match[2]}:00-03:00`;
}

export function platformDate(value?: string | null): string | null {
  if (!value) return null;
  const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : null;
}

export function localIso(date: string, time: string): string {
  const hhmm = time.slice(0, 5);
  return `${date}T${hhmm}:00-03:00`;
}

export function addDaysIso(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number);
  const value = new Date(Date.UTC(year, month - 1, day, 12));
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function mapClass(classroom: PassaporteClass): ClassRow {
  return {
    platform_class_id: classroom.id,
    short_code: shortCodeFromName(classroom.name),
    name: classroom.name,
    discipline: disciplineFromName(classroom.name),
    weekday: weekdayFromName(classroom.day_of_week),
    start_time: (classroom.start_hour || '00:00').slice(0, 5),
    end_time: (classroom.end_hour || '00:00').slice(0, 5),
    room: classroom.classRoom?.name ?? null,
    students_count: classroom.students_count ?? classroom.studentsCount ?? null,
    current_book:
      classroom.followUpPedagogico?.currentBook ?? classroom.currentBook ?? null,
    current_unit: classroom.followUpPedagogico?.currentUnit ?? null,
    last_report_at: platformDate(classroom.followUpPedagogico?.lastReport),
    active: classroom.isInactive !== true,
    platform: classroom,
    synced_at: new Date().toISOString(),
  };
}

export function reportStatus(classInfo: string | null | undefined): 'given' | 'no_students' {
  const text = stripAccents(classInfo ?? '').toLowerCase();
  return /nao compareceram|alunos ausentes|sem alunos/.test(text) ? 'no_students' : 'given';
}

export function mapReport(report: PassaporteReport): ReportRow {
  const classInfo = report.class_info ?? '';
  return {
    id: report.id,
    platform_class_id: report.class_id,
    class_date:
      platformDate(report.start_class) ?? platformDate(report.class_date) ?? '',
    start_at: localIsoFromPlatform(report.start_class),
    end_at: localIsoFromPlatform(report.end_class),
    class_info: classInfo,
    summary: classInfo,
    raw: report,
    fetched_at: new Date().toISOString(),
  };
}
