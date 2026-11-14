'use client';

import { useEffect, useMemo, useState } from 'react';
import { ClipboardCheck, ClipboardCopy, X } from 'lucide-react';
import type { ClassReportTemplate } from '@/lib/passaporte-lessons';
import { composeClassReport, normalizeAttendance } from '@/lib/aula/class-report';

type Props = {
  open: boolean;
  onClose: () => void;
  occurrenceId: string;
  classCode: string;
  date: string;
  template: ClassReportTemplate;
  savedText?: string | null;
  onSaved: (text: string) => void;
};

function rosterKey(classCode: string): string {
  return `class-report-roster:${classCode}`;
}

function readRoster(classCode: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(rosterKey(classCode));
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    return normalizeAttendance(parsed);
  } catch {
    return [];
  }
}

export default function ClassReportDialog({
  open,
  onClose,
  occurrenceId,
  classCode,
  date,
  template,
  savedText,
  onSaved,
}: Props) {
  const [names, setNames] = useState('');
  const [good, setGood] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setNames(readRoster(classCode).join('\n'));
    setGood(false);
    setError('');
    setResult(savedText ?? '');
    setCopied(false);

    let cancelled = false;
    if (!savedText) {
      fetch(`/api/class-report?occurrenceId=${encodeURIComponent(occurrenceId)}`)
        .then((response) => response.json())
        .then((payload: { report?: { text?: string; present?: string[]; goodPerformance?: boolean } } | null) => {
          if (cancelled || !payload?.report?.text) return;
          setResult(payload.report.text);
          setNames((payload.report.present ?? []).join('\n'));
          setGood(payload.report.goodPerformance === true);
        })
        .catch(() => undefined);
    }
    return () => {
      cancelled = true;
    };
  }, [open, classCode, occurrenceId, savedText]);

  const present = useMemo(
    () => normalizeAttendance(names.split(/\r?\n/)),
    [names]
  );
  const preview = useMemo(
    () =>
      composeClassReport({
        template,
        present,
        goodPerformance: good,
      }),
    [template, present, good]
  );

  if (!open) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(result || preview);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setError('Não foi possível copiar. Selecione o texto e copie manualmente.');
    }
  };

  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const response = await fetch('/api/class-report', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          occurrenceId,
          template,
          present,
          goodPerformance: good,
        }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { ok?: boolean; text?: string; error?: string }
        | null;
      if (!response.ok || !payload?.ok || !payload.text) {
        setError(payload?.error ?? 'Não foi possível salvar o relatório.');
        return;
      }
      if (typeof window !== 'undefined' && present.length > 0) {
        window.localStorage.setItem(rosterKey(classCode), JSON.stringify(present));
      }
      setResult(payload.text);
      onSaved(payload.text);
    } catch {
      setError('Falha de conexão. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-3 sm:items-center"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="class-report-title"
        className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
              {classCode} · {date}
            </p>
            <h2 id="class-report-title" className="mt-1 text-xl font-black">
              Class report do intervalo
            </h2>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              Marque quem veio. O texto base já foi escrito junto com a aula.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar class report"
            className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--muted)]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <label className="mt-4 block">
          <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
            Alunos presentes (um por linha)
          </span>
          <textarea
            value={names}
            onChange={(event) => {
              setNames(event.target.value);
              setResult('');
            }}
            rows={4}
            placeholder={'Ana\nBruno\nCarla'}
            className="mt-1.5 w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
          />
        </label>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
            {present.length} presente{present.length === 1 ? '' : 's'}
          </span>
          <button
            type="button"
            onClick={() => {
              setNames('');
              setResult('');
            }}
            className="rounded-lg border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]"
          >
            Ninguém veio
          </button>
          <button
            type="button"
            role="switch"
            aria-checked={good}
            onClick={() => {
              setGood((value) => !value);
              setResult('');
            }}
            className={
              good
                ? 'rounded-lg border-2 border-[var(--accent)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--ink)]'
                : 'rounded-lg border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]'
            }
          >
            Bom desempenho: {good ? 'on' : 'off'}
          </button>
        </div>

        <div className="mt-4 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] p-3">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            Texto do relatório
          </p>
          <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[var(--ink)]">
            {result || preview}
          </p>
          {!good && template.praise ? (
            <p className="mt-2 text-[11px] font-semibold text-[var(--muted)]">
              A terceira frase entra se você ligar “Bom desempenho”.
            </p>
          ) : null}
        </div>

        {error ? (
          <p role="alert" className="mt-3 text-sm font-bold text-[var(--danger)]">
            {error}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={copy}
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--line)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)]"
          >
            <ClipboardCopy className="h-4 w-4" aria-hidden="true" />
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--cta-bg)] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[var(--cta-text)] disabled:opacity-60"
          >
            <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
            {saving ? 'Salvando…' : result ? 'Atualizar relatório' : 'Salvar class report'}
          </button>
        </div>
      </section>
    </div>
  );
}
