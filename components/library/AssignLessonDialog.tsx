'use client';

import { useMemo, useState } from 'react';
import { CalendarDays, Loader2, X } from 'lucide-react';
import type { LibraryClass, LibraryContent } from '@/lib/library/data';

const WEEKDAYS = [
  'Domingo',
  'Segunda',
  'Terça',
  'Quarta',
  'Quinta',
  'Sexta',
  'Sábado',
];

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

type AssignLessonDialogProps = {
  content: LibraryContent;
  classes: LibraryClass[];
  onClose: () => void;
};

export default function AssignLessonDialog({
  content,
  classes,
  onClose,
}: AssignLessonDialogProps) {
  const compatibleClasses = useMemo(
    () => classes.filter((row) => row.discipline === content.discipline),
    [classes, content.discipline]
  );
  const classOptions = compatibleClasses.length > 0 ? compatibleClasses : classes;
  const [classId, setClassId] = useState(compatibleClasses[0]?.id ?? classes[0]?.id ?? '');
  const [date, setDate] = useState(todayIso());
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const selectedClass = classes.find((row) => row.id === classId);
  const weekdayMismatch =
    selectedClass && new Date(`${date}T12:00:00`).getDay() !== selectedClass.weekday;

  const submit = async () => {
    setError('');
    setSaving(true);
    try {
      const response = await fetch('/api/occurrences', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contentId: content.id, classId, date }),
      });
      const payload = (await response.json()) as { occurrenceId?: string; error?: string };
      if (!response.ok || !payload.occurrenceId) {
        throw new Error(payload.error ?? 'Não foi possível criar a aula.');
      }
      window.location.href = `/professor?aula=${payload.occurrenceId}`;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a aula.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Dar aula"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
              Dar aula
            </p>
            <h2 className="mt-1 text-xl font-black leading-tight">{content.title}</h2>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              {content.discipline} · {content.total_min ?? 150} min
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="rounded-full border-2 border-[var(--line)] p-1.5 text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
            Turma
            <select
              value={classId}
              onChange={(event) => setClassId(event.target.value)}
              className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            >
              {classOptions.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.short_code} · {WEEKDAYS[row.weekday]} {row.start_time.slice(0, 5)}–
                  {row.end_time.slice(0, 5)}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
            Data
            <input
              type="date"
              value={date}
              min={todayIso()}
              onChange={(event) => setDate(event.target.value)}
              className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
          </label>
        </div>

        <p className="mt-3 flex items-start gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-[11px] font-semibold text-[var(--muted)]">
          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
          {selectedClass
            ? `${selectedClass.short_code} · ${WEEKDAYS[selectedClass.weekday]} · ${selectedClass.start_time.slice(0, 5)}–${selectedClass.end_time.slice(0, 5)}`
            : 'Escolha uma turma.'}
          {weekdayMismatch
            ? ' Essa data não é o dia habitual da turma; será registrada como reposição.'
            : ''}
        </p>

        {error ? (
          <p className="mt-3 rounded-xl border border-rose-400/60 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-200">
            {error}
          </p>
        ) : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-[var(--line)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void submit()}
            disabled={!classId || !date || saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--cta-bg)] px-4 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Criar e abrir
          </button>
        </div>
      </div>
    </div>
  );
}
