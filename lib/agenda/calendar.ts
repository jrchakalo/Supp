import type { AgendaOccurrence, CalendarRule } from './types';

export const DAY_START_MINUTES = 7 * 60;
export const DAY_END_MINUTES = 19 * 60;
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
 * Lays out a day's occurrences in lanes. The whole day shares the same lane
 * count (simple and stable for a school agenda with at most two overlaps).
 */
export function layoutDay(occurrences: AgendaOccurrence[]): PositionedOccurrence[] {
  const sorted = [...occurrences]
    .map((occurrence) => ({ occurrence, ...timeRange(occurrence) }))
    .filter(({ start, end }) => end > DAY_START_MINUTES && start < DAY_END_MINUTES)
    .sort((a, b) => a.start - b.start || a.end - b.end);

  const laneEnds: number[] = [];
  const placed = sorted.map(({ occurrence, start, end }) => {
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
  return placed.map(({ occurrence, lane, start, end }) => {
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
