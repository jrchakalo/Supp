import type { AgendaOccurrence } from './types';
import { isoDate, parseLocalDate } from './calendar';

const BLOCKED = new Set(['cancelled', 'holiday']);

export function findOngoing(
  occurrences: AgendaOccurrence[],
  now: Date
): AgendaOccurrence | null {
  const timestamp = now.getTime();
  return (
    occurrences.find((occurrence) => {
      if (BLOCKED.has(occurrence.status)) return false;
      const start = new Date(occurrence.start_at).getTime();
      const end = new Date(occurrence.end_at).getTime();
      return timestamp >= start - 5 * 60_000 && timestamp <= end + 10 * 60_000;
    }) ?? null
  );
}

export function findNext(
  occurrences: AgendaOccurrence[],
  now: Date
): AgendaOccurrence | null {
  const timestamp = now.getTime();
  return (
    [...occurrences]
      .filter((occurrence) => {
        if (BLOCKED.has(occurrence.status)) return false;
        if (occurrence.status === 'given' || occurrence.status === 'no_students') return false;
        return new Date(occurrence.start_at).getTime() > timestamp;
      })
      .sort(
        (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
      )[0] ?? null
  );
}

export function occurrencesForDate(
  occurrences: AgendaOccurrence[],
  iso: string
): AgendaOccurrence[] {
  return occurrences
    .filter((occurrence) => occurrence.date === iso)
    .sort((a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime());
}

export function formatCountdown(target: Date, now: Date): string {
  const diff = target.getTime() - now.getTime();
  if (diff <= 0) return 'agora';
  const minutes = Math.round(diff / 60_000);
  if (minutes < 60) return `em ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (hours < 24) return rest ? `em ${hours}h ${rest}min` : `em ${hours}h`;
  const days = Math.floor(hours / 24);
  return `em ${days}d ${hours % 24}h`;
}

export function formatOccurrenceDay(iso: string, todayIso: string): string {
  if (iso === todayIso) return 'Hoje';
  const date = parseLocalDate(iso);
  const tomorrow = parseLocalDate(todayIso);
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (iso === isoDate(tomorrow)) return 'Amanhã';
  const label = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
