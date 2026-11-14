'use client';

import clsx from 'clsx';
import { Clock, Play } from 'lucide-react';
import type { Lesson } from '@/lib/passaporte-lessons';
import type { AgendaClass, AgendaContent, AgendaOccurrence } from '@/lib/agenda/types';
import { STATUS_LABEL } from '@/lib/agenda/types';
import { formatRange } from '@/lib/agenda/calendar';

type TodayClassesProps = {
  occurrences: AgendaOccurrence[];
  classes: AgendaClass[];
  contents: AgendaContent[];
  lessons: Lesson[];
  now: Date;
  onOpen: (occurrenceId: string) => void;
  onPlan: (occurrence: AgendaOccurrence) => void;
};

function statusClasses(status: string, isNow: boolean): string {
  if (isNow) return 'bg-amber-400 text-[#071018]';
  if (status === 'given') return 'bg-emerald-400 text-[#071018]';
  if (status === 'no_students') return 'bg-slate-400 text-[#071018]';
  if (status === 'planned') return 'bg-sky-400 text-[#071018]';
  if (status === 'unplanned') return 'border border-dashed border-sky-400 text-sky-300';
  return 'bg-slate-500 text-white';
}

export default function TodayClasses({
  occurrences,
  classes,
  contents,
  lessons,
  now,
  onOpen,
  onPlan,
}: TodayClassesProps) {
  const classById = new Map(classes.map((row) => [row.id, row]));
  const contentById = new Map(contents.map((row) => [row.id, row]));
  const lessonByOccurrence = new Map(
    lessons.map((lesson) => [lesson.occurrenceId ?? lesson.id, lesson])
  );

  const sorted = [...occurrences].sort(
    (a, b) => new Date(a.start_at).getTime() - new Date(b.start_at).getTime()
  );

  return (
    <section className="rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--panel-shadow)]">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            Hoje
          </p>
          <h2 className="mt-1 text-2xl font-black">Aulas de hoje</h2>
        </div>
        <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
          {sorted.length} {sorted.length === 1 ? 'aula' : 'aulas'}
        </span>
      </div>

      {sorted.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-5 text-sm font-semibold text-[var(--muted)]">
          Sem aulas hoje. Aproveite a folga!
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {sorted.map((occurrence) => {
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
            const start = new Date(occurrence.start_at).getTime();
            const end = new Date(occurrence.end_at).getTime();
            const isNow = now.getTime() >= start && now.getTime() <= end;
            const status = isNow ? 'now' : occurrence.status;

            return (
              <article
                key={occurrence.id}
                className={clsx(
                  'flex flex-wrap items-center justify-between gap-3 rounded-2xl border px-3 py-2.5',
                  isNow
                    ? 'border-amber-400/70 bg-amber-400/10'
                    : 'border-[var(--line-soft)] bg-[var(--surface-2)]/50'
                )}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide',
                        statusClasses(status, isNow)
                      )}
                    >
                      {isNow ? 'Agora' : STATUS_LABEL[occurrence.status] ?? occurrence.status}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--muted)]">
                      <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                      {formatRange(occurrence)}
                    </span>
                    <span className="text-[11px] font-black text-[var(--ink)]">
                      {classroom?.short_code ?? 'Avulsa'}
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-black">{title}</p>
                  <p className="truncate text-[11px] font-semibold text-[var(--muted)]">
                    {classroom?.name}
                    {classroom?.room ? ` · ${classroom.room}` : ''}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => (lesson ? onOpen(occurrence.id) : onPlan(occurrence))}
                  className={clsx(
                    'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-wide',
                    lesson
                      ? 'bg-[var(--cta-bg)] text-[var(--cta-text)]'
                      : 'border-2 border-dashed border-sky-400/60 text-sky-300'
                  )}
                >
                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                  {lesson ? 'Abrir' : 'Planejar'}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
