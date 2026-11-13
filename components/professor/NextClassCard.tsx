'use client';

import { CalendarDays, Clock, MapPin, Play } from 'lucide-react';
import type { AgendaClass, AgendaOccurrence } from '@/lib/agenda/types';
import { formatRange } from '@/lib/agenda/calendar';
import { formatCountdown, formatOccurrenceDay } from '@/lib/agenda/dashboard';

type NextClassCardProps = {
  occurrence: AgendaOccurrence | null;
  classroom?: AgendaClass;
  title: string;
  isNow: boolean;
  now: Date;
  today: string;
  hasLesson: boolean;
  onOpen: () => void;
  onPlan: () => void;
};

export default function NextClassCard({
  occurrence,
  classroom,
  title,
  isNow,
  now,
  today,
  hasLesson,
  onOpen,
  onPlan,
}: NextClassCardProps) {
  if (!occurrence) {
    return (
      <section className="rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--panel-shadow)]">
        <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
          Próxima aula
        </p>
        <h2 className="mt-2 text-2xl font-black">Sem aulas próximas</h2>
        <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
          Nenhuma aula prevista para os próximos dias. A agenda mostra os slots da semana.
        </p>
      </section>
    );
  }

  const start = new Date(occurrence.start_at);
  const end = new Date(occurrence.end_at);
  const dayLabel = formatOccurrenceDay(occurrence.date, today);
  const countdown = isNow
    ? `termina ${formatCountdown(end, now)}`
    : formatCountdown(start, now);

  return (
    <section className="relative overflow-hidden rounded-3xl border-2 border-[var(--accent)]/60 bg-[var(--surface)] p-5 shadow-[var(--panel-shadow)]">
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-[var(--accent)]/10 blur-2xl" />
      <div className="relative">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            {isNow ? 'Aula agora' : 'Próxima aula'}
          </p>
          <span className="rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--accent)]">
            {countdown}
          </span>
        </div>

        <h2 className="mt-2 text-2xl font-black leading-tight">
          {classroom?.short_code ?? 'Avulsa'} · {title}
        </h2>
        <p className="mt-1 text-sm font-bold text-[var(--muted)]">{classroom?.name}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs font-bold text-[var(--muted)]">
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {dayLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden="true" />
            {formatRange(occurrence)}
          </span>
          {classroom?.room ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden="true" />
              {classroom.room}
            </span>
          ) : null}
        </div>

        <button
          type="button"
          onClick={hasLesson ? onOpen : onPlan}
          className="mt-4 inline-flex items-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-[var(--cta-text)]"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          {hasLesson ? 'Abrir aula' : 'Planejar aula'}
        </button>
      </div>
    </section>
  );
}
