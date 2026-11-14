'use client';

import { useEffect, useMemo, useState } from 'react';
import { Check, ChevronLeft, ClipboardCheck, ClipboardCopy, RotateCw, X } from 'lucide-react';
import type { ClassReportTemplate } from '@/lib/passaporte-lessons';
import {
  BEHAVIOR_FEEDBACKS,
  DEFAULT_PRESENT_FEEDBACKS,
  GOOD_PERFORMANCE_FEEDBACK,
  MAX_BAD_FEEDBACKS,
  MAX_GOOD_FEEDBACKS,
  composeClassReport,
  feedbackByValue,
  normalizeAttendance,
  normalizeStudents,
  type StudentAttendance,
} from '@/lib/aula/class-report';

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
  students?: StudentAttendance[];
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

function defaultStudent(student: RosterStudent): StudentAttendance {
  return {
    id: student.id,
    name: student.name,
    present: true,
    feedbacks: [...DEFAULT_PRESENT_FEEDBACKS],
    hasMaterial: true,
  };
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
  const [students, setStudents] = useState<StudentAttendance[]>([]);
  const [rosterState, setRosterState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [fallbackNames, setFallbackNames] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<'good' | 'bad'>('good');
  const [good, setGood] = useState(false);
  const [publish, setPublish] = useState(true);
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState('');
  const [copied, setCopied] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!open) return;
    setStudents([]);
    setRosterState('loading');
    setFallbackNames(readFallback(classCode).join('\n'));
    setDetailId(null);
    setDetailTab('good');
    setGood(false);
    setPublish(true);
    setPublished(false);
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
      if (saved?.text) setResult(saved.text);
      if (saved?.goodPerformance === true) setGood(true);

      if (rosterResponse.status === 'fulfilled' && rosterResponse.value.ok) {
        const roster = Array.isArray(rosterResponse.value.payload?.students)
          ? (rosterResponse.value.payload.students as RosterStudent[])
          : [];
        const savedStudents = normalizeStudents(saved?.students);
        const savedIds = new Set(saved?.presentStudentIds ?? []);
        const savedNames = new Set(
          normalizeAttendance(saved?.present).map((name) => name.toLowerCase())
        );

        const merged = roster.map((student) => {
          const previous =
            savedStudents.find((item) => item.id && item.id === student.id) ??
            savedStudents.find(
              (item) => item.name.toLowerCase() === student.name.toLowerCase()
            );
          if (previous) {
            return {
              ...defaultStudent(student),
              present: previous.present,
              feedbacks: previous.feedbacks,
              hasMaterial: previous.hasMaterial,
            };
          }
          if (savedIds.size > 0 || savedNames.size > 0) {
            const present = savedIds.has(student.id) || savedNames.has(student.name.toLowerCase());
            return {
              ...defaultStudent(student),
              present,
              feedbacks: present ? [...DEFAULT_PRESENT_FEEDBACKS] : [],
              hasMaterial: present ? true : false,
            };
          }
          return defaultStudent(student);
        });

        setStudents(merged);
        setRosterState('ready');
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

  const present = useMemo(
    () => students.filter((student) => student.present).map((student) => student.name),
    [students]
  );
  const preview = useMemo(
    () => composeClassReport({ template, present, goodPerformance: good }),
    [template, present, good]
  );
  const detail = students.find((student) => student.id === detailId) ?? null;
  const presentCount = students.filter((student) => student.present).length;

  if (!open) return null;

  const updateStudent = (id: string, change: (student: StudentAttendance) => StudentAttendance) => {
    setStudents((current) =>
      current.map((student) => (student.id === id ? change(student) : student))
    );
    setResult('');
  };

  const togglePresence = (student: StudentAttendance) => {
    updateStudent(student.id, (current) => {
      const presentNext = !current.present;
      return {
        ...current,
        present: presentNext,
        feedbacks: presentNext
          ? current.feedbacks.length > 0
            ? current.feedbacks
            : [...DEFAULT_PRESENT_FEEDBACKS]
          : [],
        hasMaterial: presentNext ? current.hasMaterial ?? true : false,
      };
    });
  };

  const toggleGood = () => {
    const next = !good;
    setGood(next);
    setResult('');
    setStudents((current) =>
      current.map((student) => {
        if (!student.present) return student;
        const has = student.feedbacks.includes(GOOD_PERFORMANCE_FEEDBACK);
        if (next && !has) {
          return { ...student, feedbacks: [...student.feedbacks, GOOD_PERFORMANCE_FEEDBACK] };
        }
        if (!next && has) {
          return {
            ...student,
            feedbacks: student.feedbacks.filter((value) => value !== GOOD_PERFORMANCE_FEEDBACK),
          };
        }
        return student;
      })
    );
  };

  const toggleFeedback = (student: StudentAttendance, value: string) => {
    const feedback = feedbackByValue(value);
    if (!feedback || !student.present) return;
    updateStudent(student.id, (current) => {
      const has = current.feedbacks.includes(value);
      if (has) {
        return { ...current, feedbacks: current.feedbacks.filter((item) => item !== value) };
      }
      const goodCount = current.feedbacks.filter(
        (item) => feedbackByValue(item)?.nature === 'good'
      ).length;
      const badCount = current.feedbacks.filter(
        (item) => feedbackByValue(item)?.nature === 'bad'
      ).length;
      if (feedback.nature === 'good' && goodCount >= MAX_GOOD_FEEDBACKS) return current;
      if (feedback.nature === 'bad' && badCount >= MAX_BAD_FEEDBACKS) return current;
      return { ...current, feedbacks: [...current.feedbacks, value] };
    });
  };

  const setAllPresent = (value: boolean) => {
    setStudents((current) =>
      current.map((student) => ({
        ...student,
        present: value,
        feedbacks: value
          ? student.feedbacks.length > 0
            ? student.feedbacks
            : [...DEFAULT_PRESENT_FEEDBACKS]
          : [],
        hasMaterial: value ? student.hasMaterial ?? true : false,
      }))
    );
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
    if (rosterState === 'ready') {
      const missing = students.filter(
        (student) => student.present && student.feedbacks.length === 0
      );
      if (missing.length > 0) {
        setError(
          missing.length === 1
            ? `${missing[0].name} está presente sem feedback. Selecione pelo menos um feedback ou marque como ausente.`
            : `${missing.length} alunos presentes estão sem feedback. Selecione pelo menos um feedback ou marque-os como ausentes.`
        );
        return;
      }
    }

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
          presentStudentIds: students.filter((student) => student.present).map((student) => student.id),
          students: rosterState === 'ready' ? students : [],
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

      if (publish && rosterState === 'ready') {
        const publishResponse = await fetch('/api/class-report/publish', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            occurrenceId,
            text: payload.text,
            students,
          }),
        });
        const published = (await publishResponse.json().catch(() => null)) as
          | { ok?: boolean; error?: string; detail?: string }
          | null;
        if (!publishResponse.ok || !published?.ok) {
          setError(
            `Relatório salvo no Supp, mas a Passaporte recusou a publicação: ${
              published?.error ?? 'erro desconhecido'
            }`
          );
        } else {
          setPublished(true);
        }
      }
    } catch {
      setError('Falha de conexão. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  const renderFeedbackButton = (student: StudentAttendance, value: string) => {
    const feedback = feedbackByValue(value);
    if (!feedback) return null;
    const selected = student.feedbacks.includes(value);
    const natureClass = feedback.nature === 'good' ? 'text-emerald-500' : 'text-rose-500';
    return (
      <button
        key={value}
        type="button"
        onClick={() => toggleFeedback(student, value)}
        disabled={!student.present}
        className={
          selected
            ? 'rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface)] px-3 py-3 text-left disabled:opacity-40'
            : 'rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-3 text-left disabled:opacity-40'
        }
      >
        <span className="block text-xs font-black leading-tight text-[var(--ink)]">
          {feedback.label}
        </span>
        <span className={`mt-1 block text-[11px] font-black ${natureClass}`}>
          {feedback.nature === 'bad' ? '−' : '+'}
          {feedback.points}
        </span>
      </button>
    );
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
              {detail ? detail.name : 'Class report do intervalo'}
            </h2>
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              {detail
                ? 'Feedbacks comportamentais e material didático deste aluno.'
                : 'Marque quem veio. Os nomes vêm da chamada da plataforma.'}
            </p>
          </div>
          <button
            type="button"
            onClick={detail ? () => setDetailId(null) : onClose}
            aria-label={detail ? 'Voltar para a chamada' : 'Fechar class report'}
            className="rounded-xl border border-[var(--line-soft)] p-2 text-[var(--muted)]"
          >
            {detail ? <ChevronLeft className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </button>
        </div>

        {detail ? (
          <div className="mt-4">
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  Frequência
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() => {
                        if (detail.present !== value) {
                          updateStudent(detail.id, (current) => ({
                            ...current,
                            present: value,
                            feedbacks: value
                              ? current.feedbacks.length > 0
                                ? current.feedbacks
                                : [...DEFAULT_PRESENT_FEEDBACKS]
                              : [],
                            hasMaterial: value ? current.hasMaterial ?? true : false,
                          }));
                        }
                      }}
                      className={
                        detail.present === value
                          ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface)] px-3 py-2 text-xs font-black text-[var(--ink)]'
                          : 'rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-xs font-black text-[var(--muted)]'
                      }
                    >
                      {value ? 'Presente' : 'Ausente'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  Material didático
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[true, false].map((value) => (
                    <button
                      key={String(value)}
                      type="button"
                      onClick={() =>
                        updateStudent(detail.id, (current) => ({
                          ...current,
                          hasMaterial: value,
                        }))
                      }
                      className={
                        detail.hasMaterial === value
                          ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface)] px-3 py-2 text-xs font-black text-[var(--ink)]'
                          : 'rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-xs font-black text-[var(--muted)]'
                      }
                    >
                      {value ? 'Sim' : 'Não'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2">
              <div className="flex gap-1 rounded-xl bg-[var(--surface-2)] p-1">
                {(['good', 'bad'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setDetailTab(tab)}
                    className={
                      detailTab === tab
                        ? 'rounded-lg bg-[var(--surface)] px-3 py-1.5 text-[11px] font-black text-[var(--ink)]'
                        : 'rounded-lg px-3 py-1.5 text-[11px] font-black text-[var(--muted)]'
                    }
                  >
                    {tab === 'good' ? 'Positivo' : 'Precisa melhorar'}{' '}
                    {detail.feedbacks.filter(
                      (value) => feedbackByValue(value)?.nature === tab
                    ).length}
                    /{tab === 'good' ? MAX_GOOD_FEEDBACKS : MAX_BAD_FEEDBACKS}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  updateStudent(detail.id, (current) => ({ ...current, feedbacks: [] }))
                }
                className="rounded-lg border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]"
              >
                Nenhuma opção
              </button>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {BEHAVIOR_FEEDBACKS.filter((feedback) => feedback.nature === detailTab).map(
                (feedback) => renderFeedbackButton(detail, feedback.value)
              )}
            </div>

            {!detail.present ? (
              <p className="mt-3 rounded-xl border border-dashed border-[var(--line-soft)] px-3 py-2 text-[11px] font-semibold text-[var(--muted)]">
                Aluno ausente: a plataforma não permite feedback comportamental.
              </p>
            ) : null}

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setDetailId(null)}
                className="rounded-xl bg-[var(--cta-bg)] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
              >
                Voltar para a chamada
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Chamada da turma
                </span>
                <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
                  {rosterState === 'ready'
                    ? `${presentCount} de ${students.length} presentes`
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
                  <div className="mt-2 space-y-1.5">
                    {students.map((student) => {
                      const selected = student.feedbacks
                        .map((value) => feedbackByValue(value))
                        .filter(Boolean);
                      const points = selected.reduce(
                        (sum, feedback) =>
                          sum + (feedback!.nature === 'bad' ? -feedback!.points : feedback!.points),
                        0
                      );
                      return (
                        <div
                          key={student.id}
                          className={
                            student.present
                              ? 'flex items-start gap-2 rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] p-2'
                              : 'flex items-start gap-2 rounded-xl border border-dashed border-[var(--line-soft)] bg-[var(--surface)] p-2 opacity-65'
                          }
                        >
                          <button
                            type="button"
                            role="switch"
                            aria-checked={student.present}
                            aria-label={`Presença de ${student.name}`}
                            onClick={() => togglePresence(student)}
                            className={
                              student.present
                                ? 'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[var(--accent)] text-[#071018]'
                                : 'mt-0.5 h-5 w-5 shrink-0 rounded-md border-2 border-[var(--line)]'
                            }
                          >
                            {student.present ? <Check className="h-3.5 w-3.5" /> : null}
                          </button>
                          <div className="min-w-0 flex-1">
                            <button
                              type="button"
                              onClick={() => {
                                setDetailId(student.id);
                                setDetailTab('good');
                              }}
                              className="block w-full text-left text-[11px] font-black leading-tight text-[var(--ink)]"
                            >
                              {student.name}
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDetailId(student.id);
                                setDetailTab('good');
                              }}
                              className="mt-0.5 block text-left text-[10px] font-semibold leading-snug text-[var(--muted)]"
                            >
                              {selected.length === 0
                                ? 'Sem feedbacks'
                                : `${selected.map((feedback) => feedback!.label).join(' · ')}${
                                    points !== 0 ? ` (${points > 0 ? '+' : ''}${points})` : ''
                                  }`}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setAllPresent(true)}
                      className="rounded-lg border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]"
                    >
                      Todos presentes
                    </button>
                    <button
                      type="button"
                      onClick={() => setAllPresent(false)}
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
                onClick={toggleGood}
                className={
                  good
                    ? 'rounded-lg border-2 border-[var(--accent)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--ink)]'
                    : 'rounded-lg border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]'
                }
              >
                Bom desempenho: {good ? 'on' : 'off'}
              </button>
              <span className="text-[10px] font-semibold text-[var(--muted)]">
                Liga o terceiro feedback de +80 em todos os presentes.
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                role="switch"
                aria-checked={publish}
                onClick={() => setPublish((value) => !value)}
                className={
                  publish
                    ? 'rounded-lg border-2 border-[var(--accent)] bg-[var(--surface-2)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--ink)]'
                    : 'rounded-lg border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]'
                }
              >
                Publicar na Passaporte: {publish ? 'on' : 'off'}
              </button>
              <span className="text-[10px] font-semibold text-[var(--muted)]">
                Cria ou atualiza o report de hoje com os feedbacks selecionados.
              </span>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] p-3">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                Texto do relatório
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm font-semibold leading-relaxed text-[var(--ink)]">
                {result || preview}
              </p>
            </div>

            {error ? (
              <p role="alert" className="mt-3 text-sm font-bold text-[var(--danger)]">
                {error}
              </p>
            ) : null}
            {published ? (
              <p className="mt-3 text-sm font-bold text-emerald-500">
                Relatório salvo e publicado na Passaporte.
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
          </>
        )}
      </section>
    </div>
  );
}
