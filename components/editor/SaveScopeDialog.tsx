'use client';

import { useMemo, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import type { Segment } from '@/lib/passaporte-lessons';
import type { EditorClass, EditorContent, EditorOccurrence } from '@/lib/editor/data';
import { STATUS_LABEL } from '@/lib/agenda/types';

type SaveScopeDialogProps = {
  content: EditorContent;
  occurrences: EditorOccurrence[];
  classes: EditorClass[];
  segments: Segment[];
  title: string;
  totalMin: number;
  initialOccurrenceId: string;
  onClose: () => void;
  onSaved: (scope: 'global' | 'local', version?: number) => void;
};

function dateLabel(iso: string): string {
  return new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
  });
}

export default function SaveScopeDialog({
  content,
  occurrences,
  classes,
  segments,
  title,
  totalMin,
  initialOccurrenceId,
  onClose,
  onSaved,
}: SaveScopeDialogProps) {
  const editable = useMemo(
    () =>
      occurrences.filter(
        (occurrence) =>
          occurrence.status !== 'given' &&
          occurrence.status !== 'no_students' &&
          occurrence.status !== 'cancelled'
      ),
    [occurrences]
  );
  const givenCount = occurrences.length - editable.length;
  const classById = new Map(classes.map((row) => [row.id, row]));

  const [scope, setScope] = useState<'global' | 'local'>(
    editable.length > 0 ? (initialOccurrenceId ? 'local' : 'global') : 'global'
  );
  const [occurrenceId, setOccurrenceId] = useState(
    editable.find((row) => row.id === initialOccurrenceId)?.id ?? editable[0]?.id ?? ''
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    setSaving(true);
    try {
      if (scope === 'local') {
        if (!occurrenceId) throw new Error('Escolha a aula que receberá a edição local.');
        const response = await fetch('/api/editor/occurrence', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ occurrenceId, segments }),
        });
        const payload = (await response.json()) as { error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'Não foi possível salvar.');
        onSaved('local');
        return;
      }

      const response = await fetch('/api/editor/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contentId: content.id, title, totalMin, segments }),
      });
      const payload = (await response.json()) as { version?: number; error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'Não foi possível salvar.');
      onSaved('global', payload.version);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar.');
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Onde aplicar a edição"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-xl rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
              Salvar alteração
            </p>
            <h2 className="mt-1 text-xl font-black">Onde aplicar?</h2>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              Aulas já dadas mantêm o snapshot antigo.
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

        <div className="mt-5 space-y-3">
          <label
            className={`block cursor-pointer rounded-2xl border-2 p-3 transition ${
              scope === 'local'
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--line-soft)] bg-[var(--surface-2)]'
            }`}
          >
            <span className="flex items-start gap-2">
              <input
                type="radio"
                name="scope"
                value="local"
                checked={scope === 'local'}
                onChange={() => setScope('local')}
                disabled={editable.length === 0}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-black">Só esta aula desta turma</span>
                <span className="block text-[11px] font-semibold text-[var(--muted)]">
                  Grava um snapshot local. As outras turmas não mudam.
                </span>
              </span>
            </span>

            {scope === 'local' ? (
              <select
                value={occurrenceId}
                onChange={(event) => setOccurrenceId(event.target.value)}
                className="mt-3 w-full rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              >
                {editable.map((occurrence) => {
                  const classroom = occurrence.class_id
                    ? classById.get(occurrence.class_id)
                    : undefined;
                  return (
                    <option key={occurrence.id} value={occurrence.id}>
                      {classroom?.short_code ?? 'Avulsa'} · {dateLabel(occurrence.date)} ·{' '}
                      {STATUS_LABEL[occurrence.status] ?? occurrence.status}
                    </option>
                  );
                })}
              </select>
            ) : null}

            {editable.length === 0 ? (
              <span className="mt-2 block text-[10px] font-bold text-rose-300">
                Não há aula futura deste conteúdo para edição local.
              </span>
            ) : null}
          </label>

          <label
            className={`block cursor-pointer rounded-2xl border-2 p-3 transition ${
              scope === 'global'
                ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                : 'border-[var(--line-soft)] bg-[var(--surface-2)]'
            }`}
          >
            <span className="flex items-start gap-2">
              <input
                type="radio"
                name="scope"
                value="global"
                checked={scope === 'global'}
                onChange={() => setScope('global')}
                className="mt-1"
              />
              <span>
                <span className="block text-sm font-black">Todas as aulas deste conteúdo</span>
                <span className="block text-[11px] font-semibold text-[var(--muted)]">
                  Cria uma nova versão do conteúdo. {givenCount} aula(s) já dada(s) não mudam.
                </span>
              </span>
            </span>
          </label>
        </div>

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
            disabled={saving || (scope === 'local' && !occurrenceId)}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--cta-bg)] px-4 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
