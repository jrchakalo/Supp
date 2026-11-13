'use client';

import { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { RefreshCw } from 'lucide-react';
import type { Lesson } from '@/lib/passaporte-lessons';
import type { AgendaData, AgendaOccurrence } from '@/lib/agenda/types';
import {
  AGENDA_HEIGHT,
  PIXELS_PER_HOUR,
  formatRange,
  isOffDay,
  isoDate,
  layoutDay,
  monthLabel,
  monthWeeks,
  parseLocalDate,
  weekIndexForDate,
} from '@/lib/agenda/calendar';

type WeekAgendaProps = {
  data: AgendaData;
  lessons: Lesson[];
  now: Date;
  onOpenOccurrence: (occurrenceId: string) => void;
  onRefresh?: () => void;
  refreshing?: boolean;
  updatedAt?: number | null;
};

function updatedLabel(updatedAt: number | null | undefined): string {
  if (!updatedAt) return 'Ainda não atualizado';
  const minutes = Math.max(0, Math.round((Date.now() - updatedAt) / 60_000));
  if (minutes < 1) return 'Atualizado agora';
  if (minutes < 60) return `Atualizado há ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `Atualizado há ${hours}h`;
}

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

function eventClasses(status: string): string {
  switch (status) {
    case 'given':
      return 'border-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/15';
    case 'no_students':
      return 'border-slate-400 bg-slate-500/10';
    case 'planned':
      return 'border-sky-400 bg-sky-500/10 hover:bg-sky-500/15';
    case 'unplanned':
      return 'border-dashed border-sky-400/60 bg-sky-500/5';
    case 'cancelled':
    case 'missed':
      return 'border-slate-500 bg-slate-500/10 opacity-60';
    default:
      return 'border-[var(--line)] bg-[var(--surface-2)]';
  }
}

function statusLabel(status: string): string {
  switch (status) {
    case 'given':
      return 'Dada';
    case 'no_students':
      return 'Sem alunos';
    case 'planned':
      return 'Prevista';
    case 'unplanned':
      return 'A planejar';
    case 'cancelled':
      return 'Cancelada';
    case 'missed':
      return 'Não dada';
    default:
      return status;
  }
}

export default function WeekAgenda({
  data,
  lessons,
  now,
  onOpenOccurrence,
  onRefresh,
  refreshing,
  updatedAt,
}: WeekAgendaProps) {
  const today = isoDate(now);
  const year = now.getFullYear();
  const month = now.getMonth();
  const weeks = useMemo(() => monthWeeks(year, month), [year, month]);
  const [weekIndex, setWeekIndex] = useState(() => weekIndexForDate(weeks, today));
  const monthKey = `${year}-${month}`;

  useEffect(() => {
    setWeekIndex(weekIndexForDate(weeks, today));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthKey]);

  const week = weeks[Math.min(Math.max(weekIndex, 0), weeks.length - 1)];
  const classById = useMemo(
    () => new Map(data.classes.map((row) => [row.id, row])),
    [data.classes]
  );
  const contentById = useMemo(
    () => new Map(data.contents.map((row) => [row.id, row])),
    [data.contents]
  );
  const lessonByOccurrence = useMemo(
    () => new Map(lessons.map((lesson) => [lesson.occurrenceId ?? lesson.id, lesson])),
    [lessons]
  );

  const occurrencesByDay = useMemo(() => {
    const map = new Map<string, AgendaOccurrence[]>();
    for (const occurrence of data.occurrences) {
      const list = map.get(occurrence.date);
      if (list) list.push(occurrence);
      else map.set(occurrence.date, [occurrence]);
    }
    return map;
  }, [data.occurrences]);

  return (
    <section className="rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] sm:p-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            Agenda
          </p>
          <h2 className="mt-1 text-2xl font-black">
            {monthLabel(year, month)}
          </h2>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
            {updatedLabel(updatedAt)}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onRefresh ? (
            <button
              type="button"
              onClick={onRefresh}
              disabled={refreshing}
              className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)] disabled:opacity-50"
            >
              <RefreshCw
                className={refreshing ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'}
                aria-hidden="true"
              />
              {refreshing ? 'Atualizando' : 'Atualizar'}
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => setWeekIndex(weekIndexForDate(weeks, today))}
            className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={() => setWeekIndex((value) => Math.max(0, value - 1))}
            disabled={weekIndex === 0}
            aria-label="Semana anterior"
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] text-sm font-black text-[var(--ink)] disabled:opacity-35"
          >
            ‹
          </button>
          <div className="min-w-[10rem] text-center">
            <p className="text-sm font-black">{week.label}</p>
            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
              {weekIndex + 1} de {weeks.length} semanas
            </p>
          </div>
          <button
            type="button"
            onClick={() => setWeekIndex((value) => Math.min(weeks.length - 1, value + 1))}
            disabled={weekIndex === weeks.length - 1}
            aria-label="Próxima semana"
            className="flex h-8 w-8 items-center justify-center rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] text-sm font-black text-[var(--ink)] disabled:opacity-35"
          >
            ›
          </button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
            <div className="rounded-tl-xl border border-[var(--line-soft)] bg-[var(--surface-2)]" />
            {week.days.map((day) => {
              const date = parseLocalDate(day);
              const isToday = day === today;
              const off = isOffDay(day, data.rules);
              return (
                <div
                  key={day}
                  className={clsx(
                    'border-b border-r border-[var(--line-soft)] px-2 py-1.5 text-center',
                    isToday ? 'bg-[var(--accent)]/10' : 'bg-[var(--surface-2)]'
                  )}
                >
                  <p
                    className={clsx(
                      'text-[10px] font-black uppercase tracking-[0.14em]',
                      isToday ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                    )}
                  >
                    {WEEKDAY_SHORT[date.getDay()]}
                  </p>
                  <p className="text-sm font-black">
                    {String(date.getDate()).padStart(2, '0')}/
                    {String(date.getMonth() + 1).padStart(2, '0')}
                  </p>
                  {off ? (
                    <p className="text-[9px] font-black uppercase tracking-wide text-[var(--muted)]">
                      Folga
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-[56px_repeat(7,minmax(0,1fr))]">
            <div className="relative border-l border-[var(--line-soft)]" style={{ height: AGENDA_HEIGHT }}>
              {Array.from({ length: 13 }, (_, index) => 7 + index).map((hour) => (
                <span
                  key={hour}
                  className="absolute right-1 -translate-y-1/2 text-[9px] font-bold text-[var(--muted)]"
                  style={{ top: (hour - 7) * PIXELS_PER_HOUR + 2 }}
                >
                  {String(hour).padStart(2, '0')}:00
                </span>
              ))}
            </div>

            {week.days.map((day) => {
              const date = parseLocalDate(day);
              const isToday = day === today;
              const off = isOffDay(day, data.rules);
              const events = layoutDay(occurrencesByDay.get(day) ?? []);
              return (
                <div
                  key={day}
                  className={clsx(
                    'relative border-r border-[var(--line-soft)]',
                    isToday && 'bg-[var(--accent)]/5'
                  )}
                  style={{
                    height: AGENDA_HEIGHT,
                    backgroundImage:
                      'linear-gradient(to bottom, var(--line-soft) 1px, transparent 1px)',
                    backgroundSize: `100% ${PIXELS_PER_HOUR}px`,
                  }}
                >
                  {off ? (
                    <div
                      className="pointer-events-none absolute inset-0"
                      style={{
                        backgroundImage:
                          'repeating-linear-gradient(135deg, rgba(148,163,184,0.08) 0 6px, transparent 6px 12px)',
                      }}
                    />
                  ) : null}

                  {events.map(({ occurrence, lane, lanes, top, height }) => {
                    const classroom = occurrence.class_id
                      ? classById.get(occurrence.class_id)
                      : undefined;
                    const lesson = lessonByOccurrence.get(occurrence.id);
                    const title =
                      lesson?.title ??
                      (occurrence.content_id
                        ? contentById.get(occurrence.content_id)?.title
                        : null) ??
                      'Aula a planejar';
                    const width = 100 / lanes;
                    return (
                      <button
                        key={occurrence.id}
                        type="button"
                        onClick={() => onOpenOccurrence(occurrence.id)}
                        title={`${formatRange(occurrence)} · ${classroom?.short_code ?? 'Avulsa'} · ${title} · ${statusLabel(occurrence.status)}`}
                        className={clsx(
                          'absolute overflow-hidden rounded-md border-l-4 px-1.5 py-1 text-left shadow-sm transition',
                          eventClasses(occurrence.status)
                        )}
                        style={{
                          top,
                          height,
                          left: `calc(${lane * width}% + 3px)`,
                          width: `calc(${width}% - 6px)`,
                        }}
                      >
                        <span className="block truncate text-[9px] font-black text-[var(--ink)]">
                          {formatRange(occurrence)}
                        </span>
                        <span className="block truncate text-[9px] font-bold text-[var(--muted)]">
                          {classroom?.short_code ?? 'Avulsa'}
                        </span>
                        <span className="mt-0.5 line-clamp-2 block text-[9px] font-bold leading-tight text-[var(--ink)]">
                          {title}
                        </span>
                      </button>
                    );
                  })}

                  {off && events.length === 0 ? (
                    <span className="absolute left-1/2 top-3 -translate-x-1/2 text-[9px] font-black uppercase tracking-wide text-[var(--muted)]">
                      Folga
                    </span>
                  ) : null}
                  {isToday ? (
                    <span className="absolute right-1 top-1 text-[8px] font-black uppercase tracking-wide text-[var(--accent)]">
                      Hoje
                    </span>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] font-semibold text-[var(--muted)]">
        <Legend color="bg-emerald-400" label="Dada" />
        <Legend color="bg-sky-400" label="Prevista" />
        <Legend color="bg-slate-400" label="Sem alunos / cancelada" />
        <span className="inline-flex items-center gap-1">
          <span className="h-2 w-2 rounded-full border border-dashed border-sky-400" />
          A planejar
        </span>
        <span>Clique em uma aula para abrir.</span>
      </div>
    </section>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
