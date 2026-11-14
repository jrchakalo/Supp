'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ClipboardCheck, ClipboardCopy, RotateCw, X } from 'lucide-react';
import type { ClassReportTemplate } from '@/lib/passaporte-lessons';
import { composeClassReport, normalizeAttendance, normalizeStudentIds } from '@/lib/aula/class-report';

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

type RosterStudent = { id: string; name: string };
type SavedReport = {
  text?: string;
  present?: string[];
  presentStudentIds?: string[];
  goodPerformance?: boolean;
};

function readFallback(classCode: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(`class-report-roster:${classCode}`);
    if (!raw) return [];
    return normalizeAttendance(JSON.parse(raw));
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
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [rosterState, setRosterState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [presentIds, setPresentIds] = useState<Set<string>>(new Set());
  const [fallbackNames, setFallbackNames] = useState('');
  const [good, setGood] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    setRoster([]);
    setRosterState('loading');
    setPresentIds(new Set());
    setFallbackNames(readFallback(classCode).join('\n'));
    setGood(false);
    setError('');
    setResult(savedText ?? '');
    setCopied(false);

    let cancelled = false;
    const load = async () => {
      const [rosterResponse, reportResponse] = await Promise.allSettled([
        fetch(`/api/class-roster?occurrenceId=${encodeURIComponent(occurrenceId)}`).then(
          async (response) => ({ ok: response.ok, payload: await response.json().catch(() => null) })
        ),
        fetch(`/api/class-report?occurrenceId=${encodeURIComponent(occurrenceId)}`).then(
          async (response) => ({ ok: response.ok, payload: await response.json().catch(() => null) })
        ),
      ]);
      if (cancelled) return;

      const saved =
        reportResponse.status === 'fulfilled' && reportResponse.value.ok
          ? (reportResponse.value.payload?.report as SavedReport | null)
          : null;
      if (saved?.text) {
        setResult(saved.text);
        setGood(saved.goodPerformance === true);
      }

      if (rosterResponse.status === 'fulfilled' && rosterResponse.value.ok) {
        const students = Array.isArray(rosterResponse.value.payload?.students)
          ? (rosterResponse.value.payload.students as RosterStudent[])
          : [];
        setRoster(students);
        setRosterState('ready');
        const savedIds = normalizeStudentIds(saved?.presentStudentIds);
        const savedNames = new Set(
          normalizeAttendance(saved?.present).map((name) => name.toLowerCase())
        );
        if (savedIds.length > 0) {
          setPresentIds(new Set(savedIds));
        } else if (savedNames.size > 0) {
          setPresentIds(
            new Set(
              students
                .filter((student) => savedNames.has(student.name.toLowerCase()))
                .map((student) => student.id)
            )
          );
        } else {
          setPresentIds(new Set(students.map((student) => student.id)));
        }
        return;
      }

      setRosterState('error');
      if (saved?.present?.length) {
        setFallbackNames(normalizeAttendance(saved.present).join('\n'));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [open, occurrenceId, classCode, savedText, retry]);

  const fallbackPresent = useMemo(
    () => normalizeAttendance(fallbackNames.split(/\r?\n/)),
    [fallbackNames]
  );
  const present = useMemo(
    () =>
      rosterState === 'ready'
        ? roster.filter((student) => presentIds.has(student.id)).map((student) => student.name)
        : fallbackPresent,
    [rosterState, roster, presentIds, fallbackPresent]
  );
  const preview = useMemo(
    () => composeClassReport({ template, present, goodPerformance: good }),
    [template, present, good]
  );

  if (!open) return null;

  const toggleStudent = (id: string) => {
    setPresentIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setResult('');
  };

  const setAll = (value: boolean) => {
    setPresentIds(new Set(value ? roster.map((student) => student.id) : []));
    setResult('');
  };

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
          presentStudentIds: rosterState === 'ready' ? Array.from(presentIds) : [],
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
        window.localStorage.setItem(
          `class-report-roster:${classCode}`,
          JSON.stringify(present)
        );
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
              Marque quem veio. Os nomes vêm da chamada da plataforma.
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

        <div className="mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
              Chamada da turma
            </span>
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
              {rosterState === 'ready'
                ? `${present.length} de ${roster.length} presentes`
                : `${present.length} presente${present.length === 1 ? '' : 's'}`}
            </span>
          </div>

          {rosterState === 'loading' ? (
            <p className="mt-3 rounded-2xl border border-dashed border-[var(--line-soft)] px-3 py-4 text-xs font-semibold text-[var(--muted)]">
              Carregando os nomes da turma…
            </p>
          ) : rosterState === 'error' ? (
            <div className="mt-3 rounded-2xl border-2 border-[var(--danger)]/40 bg-[var(--surface-2)] p-3">
              <p className="text-xs font-bold text-[var(--ink)]">
                Não foi possível carregar a chamada da plataforma.
              </p>
              <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
                Confira a conexão. Enquanto isso, digite os nomes presentes:
              </p>
              <textarea
                value={fallbackNames}
                onChange={(event) => {
                  setFallbackNames(event.target.value);
                  setResult('');
                }}
                rows={4}
                placeholder={'Ana\nBruno'}
                className="mt-2 w-full rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
              <button
                type="button"
                onClick={() => {
                  setRosterState('loading');
                  setError('');
                  setRetry((value) => value + 1);
                }}
                className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]"
              >
                <RotateCw className="h-3 w-3" aria-hidden="true" />
                Tentar de novo
              </button>
            </div>
          ) : (
            <>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {roster.map((student) => {
                  const checked = presentIds.has(student.id);
                  return (
                    <button
                      key={student.id}
                      type="button"
                      role="switch"
                      aria-checked={checked}
                      onClick={() => toggleStudent(student.id)}
                      className={
                        checked
                          ? 'flex items-center gap-2 rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-2.5 py-2 text-left'
                          : 'flex items-center gap-2 rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] px-2.5 py-2 text-left opacity-65'
                      }
                    >
                      <span
                        aria-hidden="true"
                        className={
                          checked
                            ? 'flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[#071018]'
                            : 'h-5 w-5 shrink-0 rounded-md border-2 border-[var(--line)]'
                        }
                      >
                        {checked ? <Check className="h-3.5 w-3.5" /> : null}
                      </span>
                      <span className="min-w-0 flex-1 text-[11px] font-black leading-tight text-[var(--ink)]">
                        {student.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setAll(true)}
                  className="rounded-lg border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]"
                >
                  Todos presentes
                </button>
                <button
                  type="button"
                  onClick={() => setAll(false)}
                  className="rounded-lg border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]"
                >
                  Ninguém
                </button>
              </div>
            </>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
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
