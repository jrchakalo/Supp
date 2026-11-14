import type { AgendaOccurrence, CalendarRule } from './types';

export const DAY_START_MINUTES = 7 * 60;
export const DAY_END_MINUTES = 18 * 60;
export const PIXELS_PER_HOUR = 40;
export const AGENDA_HEIGHT =
  ((DAY_END_MINUTES - DAY_START_MINUTES) / 60) * PIXELS_PER_HOUR;

const MONTHS = [
  'janeiro',
  'fevereiro',
  'março',
  'abril',
  'maio',
  'junho',
  'julho',
  'agosto',
  'setembro',
  'outubro',
  'novembro',
  'dezembro',
];

export function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function parseLocalDate(iso: string): Date {
  return new Date(`${iso}T12:00:00`);
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function mondayOf(date: Date): Date {
  const day = date.getDay();
  return addDays(date, -((day + 6) % 7));
}

export function monthLabel(year: number, monthIndex: number): string {
  const label = `${MONTHS[monthIndex]} de ${year}`;
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export type AgendaWeek = {
  start: string;
  end: string;
  days: string[];
  label: string;
  monthIndex: number;
};

function shortDate(date: Date): string {
  return `${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

function weekLabel(first: Date, last: Date): string {
  if (first.getMonth() === last.getMonth()) {
    return `${first.getDate()}–${last.getDate()} de ${MONTHS[first.getMonth()]}`;
  }
  return `${shortDate(first)} – ${shortDate(last)}`;
}

/** All Monday–Sunday weeks covering the given month (first week may start earlier). */
export function monthWeeks(year: number, monthIndex: number): AgendaWeek[] {
  const first = new Date(year, monthIndex, 1, 12);
  const last = new Date(year, monthIndex + 1, 0, 12);
  const cursor = mondayOf(first);
  const end = addDays(mondayOf(last), 6);
  const weeks: AgendaWeek[] = [];

  while (cursor <= end) {
    const days = Array.from({ length: 7 }, (_, index) => isoDate(addDays(cursor, index)));
    weeks.push({
      start: days[0],
      end: days[6],
      days,
      label: weekLabel(parseLocalDate(days[0]), parseLocalDate(days[6])),
      monthIndex,
    });
    cursor.setDate(cursor.getDate() + 7);
  }

  return weeks;
}

export function weekIndexForDate(weeks: AgendaWeek[], iso: string): number {
  const index = weeks.findIndex((week) => iso >= week.start && iso <= week.end);
  return index >= 0 ? index : 0;
}

export function isOffDay(iso: string, rules: CalendarRule[]): boolean {
  const date = parseLocalDate(iso);
  const weekday = date.getDay();
  return rules.some((rule) => {
    if (rule.date) return rule.date === iso;
    if (rule.weekday !== weekday) return false;
    if (iso < rule.from_date) return false;
    return !rule.to_date || iso <= rule.to_date;
  });
}

export function timeRange(occurrence: AgendaOccurrence): { start: number; end: number } {
  const start = new Date(occurrence.start_at);
  const end = new Date(occurrence.end_at);
  const startMinutes = start.getHours() * 60 + start.getMinutes();
  const endMinutes =
    end.getHours() * 60 + end.getMinutes() || startMinutes + 60;
  return { start: startMinutes, end: endMinutes };
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatRange(occurrence: AgendaOccurrence): string {
  return `${formatTime(occurrence.start_at)}–${formatTime(occurrence.end_at)}`;
}

export type PositionedOccurrence = {
  occurrence: AgendaOccurrence;
  lane: number;
  lanes: number;
  top: number;
  height: number;
};

/**
 * Lays out a day's occurrences in lanes. Overlaps are grouped in clusters, so
 * an overlap at 09:30 does not squeeze an isolated 15:30 class into half width.
 */
export function layoutDay(occurrences: AgendaOccurrence[]): PositionedOccurrence[] {
  const sorted = [...occurrences]
    .map((occurrence) => ({ occurrence, ...timeRange(occurrence) }))
    .filter(({ start, end }) => end > DAY_START_MINUTES && start < DAY_END_MINUTES)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const clusters: Array<Array<{ occurrence: AgendaOccurrence; start: number; end: number }>> = [];
  for (const event of sorted) {
    const current = clusters[clusters.length - 1];
    const clusterEnd = current?.reduce((max, item) => Math.max(max, item.end), 0) ?? 0;
    if (!current || event.start >= clusterEnd) {
      clusters.push([event]);
    } else {
      current.push(event);
    }
  }

  const placed: Array<{
    occurrence: AgendaOccurrence;
    lane: number;
    lanes: number;
    start: number;
    end: number;
  }> = [];

  for (const cluster of clusters) {
    const laneEnds: number[] = [];
    const clusterPlaced = cluster.map(({ occurrence, start, end }) => {
      let lane = laneEnds.findIndex((lastEnd) => lastEnd <= start);
      if (lane === -1) {
        lane = laneEnds.length;
        laneEnds.push(end);
      } else {
        laneEnds[lane] = end;
      }
      return { occurrence, lane, start, end };
    });
    const lanes = Math.max(1, laneEnds.length);
    for (const event of clusterPlaced) placed.push({ ...event, lanes });
  }

  return placed.map(({ occurrence, lane, lanes, start, end }) => {
    const clampedStart = Math.max(start, DAY_START_MINUTES);
    const clampedEnd = Math.min(end, DAY_END_MINUTES);
    return {
      occurrence,
      lane,
      lanes,
      top: ((clampedStart - DAY_START_MINUTES) / 60) * PIXELS_PER_HOUR,
      height: Math.max(26, ((clampedEnd - clampedStart) / 60) * PIXELS_PER_HOUR),
    };
  });
}

/**
 * Some classes share the same weekday/time and alternate week by week. The
 * anchor is the Monday of week A; reports confirm the 14-day cadence.
 */
const PARITY_ANCHOR = '2026-10-05';
const CLASS_WEEK_PARITY: Record<string, 0 | 1> = {
  'C1-01': 0,
  'C2-01': 0,
  'C2-03': 0,
  'C2-04': 1,
  'C1-02': 1,
  'C2-02': 1,
};

export function weekParity(iso: string): 0 | 1 {
  const days = Math.floor(
    (parseLocalDate(iso).getTime() - parseLocalDate(PARITY_ANCHOR).getTime()) / 86_400_000
  );
  const weeks = Math.floor(days / 7);
  return (((weeks % 2) + 2) % 2) as 0 | 1;
}

export function classOccursOn(shortCode: string, iso: string): boolean {
  const parity = CLASS_WEEK_PARITY[shortCode];
  return parity === undefined || parity === weekParity(iso);
}
