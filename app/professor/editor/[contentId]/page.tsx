'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  Plus,
  Redo2,
  Save,
  Trash2,
  Undo2,
} from 'lucide-react';
import RequireProfessor from '@/components/professor/RequireProfessor';
import SaveScopeDialog from '@/components/editor/SaveScopeDialog';
import { SlideStage } from '@/components/aula/SlideView';
import type { Segment, Slide } from '@/lib/passaporte-lessons';
import {
  fetchEditorData,
  type EditorData,
} from '@/lib/editor/data';

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function lines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
      {label}
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
      />
    </label>
  );
}

function TextArea({
  label,
  value,
  onChange,
  rows = 4,
  hint,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
      {label}
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        rows={rows}
        className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 font-mono text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
      />
      {hint ? <span className="text-[9px] font-semibold normal-case tracking-normal">{hint}</span> : null}
    </label>
  );
}

function SlideFields({
  slide,
  update,
}: {
  slide: Slide;
  update: (patch: Record<string, unknown>) => void;
}) {
  switch (slide.kind) {
    case 'cover':
      return (
        <TextArea
          label="Chips"
          value={(slide.chips ?? []).join('\n')}
          onChange={(value) => update({ chips: lines(value) })}
          hint="Um por linha."
        />
      );
    case 'bullets':
    case 'quiz':
      return (
        <TextArea
          label="Bullets"
          value={slide.bullets.join('\n')}
          onChange={(value) => update({ bullets: lines(value) })}
          rows={7}
          hint="Um por linha. Mais de 6 viram duas colunas na TV."
        />
      );
    case 'big':
      return (
        <TextArea
          label="Linhas"
          value={slide.lines.join('\n')}
          onChange={(value) => update({ lines: lines(value) })}
          rows={5}
          hint="Uma por linha."
        />
      );
    case 'table':
      return (
        <div className="grid gap-3">
          <Field
            label="Cabeçalho"
            value={slide.head.join(' | ')}
            onChange={(value) =>
              update({ head: value.split('|').map((cell) => cell.trim()) })
            }
            placeholder="Categoria | Exemplos"
          />
          <TextArea
            label="Linhas"
            value={slide.rows.map((row) => row.join(' | ')).join('\n')}
            onChange={(value) =>
              update({
                rows: value
                  .split('\n')
                  .map((line) => line.split('|').map((cell) => cell.trim()))
                  .filter((row) => row.some(Boolean)),
              })
            }
            rows={6}
            hint="Uma linha por registro; células separadas por |."
          />
        </div>
      );
    case 'code':
      return (
        <div className="grid gap-3">
          <TextArea
            label="Código"
            value={slide.code}
            onChange={(value) => update({ code: value })}
            rows={9}
          />
          <TextArea
            label="Legenda do código"
            value={(slide.rows ?? []).map((row) => `${row.left} | ${row.right}`).join('\n')}
            onChange={(value) =>
              update({
                rows: value
                  .split('\n')
                  .map((line) => line.split('|'))
                  .filter((parts) => parts.length >= 1 && parts[0].trim())
                  .map((parts) => ({ left: parts[0].trim(), right: (parts[1] ?? '').trim() })),
              })
            }
            rows={4}
            hint="Esquerda | direita, uma por linha."
          />
        </div>
      );
    case 'case': {
      const options = slide.options.map((option) =>
        typeof option === 'string' ? option : option.text
      );
      return (
        <div className="grid gap-3">
          <Field
            label="Pergunta"
            value={slide.prompt}
            onChange={(value) => update({ prompt: value })}
          />
          <TextArea
            label="Opções"
            value={options.join('\n')}
            onChange={(value) => update({ options: lines(value) })}
            rows={5}
            hint="Uma por linha."
          />
          <Field
            label="Índice correto (0–3)"
            value={String(slide.correct ?? 0)}
            onChange={(value) => update({ correct: Number(value) || 0 })}
          />
        </div>
      );
    }
    case 'flash':
      return (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="URL da imagem"
            value={slide.imageUrl ?? ''}
            onChange={(value) => update({ imageUrl: value })}
            placeholder="https://…"
          />
          <Field
            label="Segundos"
            value={String(slide.seconds ?? 3)}
            onChange={(value) => update({ seconds: Number(value) || 3 })}
          />
        </div>
      );
    case 'question':
      return (
        <div className="grid gap-3">
          <Field
            label="Pergunta"
            value={slide.question}
            onChange={(value) => update({ question: value })}
          />
          <TextArea
            label="Opções"
            value={slide.options.join('\n')}
            onChange={(value) => update({ options: lines(value) })}
            rows={4}
          />
        </div>
      );
    case 'answer':
      return (
        <div className="grid gap-3">
          <Field
            label="Pergunta"
            value={slide.question}
            onChange={(value) => update({ question: value })}
          />
          <TextArea
            label="Opções"
            value={slide.options.join('\n')}
            onChange={(value) => update({ options: lines(value) })}
            rows={4}
          />
          <Field
            label="Índice correto (0–3)"
            value={String(slide.correctIndex)}
            onChange={(value) => update({ correctIndex: Number(value) || 0 })}
          />
          <Field
            label="Explicação"
            value={slide.explanation ?? ''}
            onChange={(value) => update({ explanation: value })}
          />
        </div>
      );
    default:
      return null;
  }
}

function EditorContent() {
  const params = useParams();
  const contentId = Array.isArray(params.contentId)
    ? params.contentId[0]
    : (params.contentId ?? '');

  const [data, setData] = useState<EditorData | null>(null);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState('');
  const [totalMin, setTotalMin] = useState(150);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selected, setSelected] = useState({ segmentIndex: 0, slideIndex: 0 });
  const [history, setHistory] = useState<Segment[][]>([]);
  const [future, setFuture] = useState<Segment[][]>([]);
  const [initialOccurrenceId, setInitialOccurrenceId] = useState('');
  const [showSave, setShowSave] = useState(false);
  const [message, setMessage] = useState('');
  const segmentsRef = useRef<Segment[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!contentId) return;
    let active = true;
    fetchEditorData(contentId)
      .then((payload) => {
        if (!active) return;
        if (!payload) {
          setError(true);
          return;
        }
        setData(payload);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, [contentId]);

  useEffect(() => {
    if (!data || initializedRef.current) return;
    const occurrenceId = new URLSearchParams(window.location.search).get('occurrence') ?? '';
    const occurrence = data.occurrences.find((row) => row.id === occurrenceId);
    const base = occurrence?.snapshot ?? data.content.segments;
    setInitialOccurrenceId(occurrence?.id ?? '');
    setTitle(data.content.title);
    setTotalMin(data.content.total_min ?? 150);
    setSegments(clone(base));
    setSelected({ segmentIndex: 0, slideIndex: 0 });
    setReady(true);
    initializedRef.current = true;
  }, [data]);

  useEffect(() => {
    segmentsRef.current = segments;
  }, [segments]);

  useEffect(() => {
    if (segments.length === 0) return;
    const segmentIndex = Math.min(selected.segmentIndex, segments.length - 1);
    const slideIndex = Math.min(
      selected.slideIndex,
      Math.max(0, segments[segmentIndex].slides.length - 1)
    );
    if (segmentIndex !== selected.segmentIndex || slideIndex !== selected.slideIndex) {
      setSelected({ segmentIndex, slideIndex });
    }
  }, [segments, selected]);

  const segment = segments[selected.segmentIndex];
  const slide = segment?.slides[selected.slideIndex];
  const slideData = slide as unknown as Record<string, unknown> | undefined;

  const apply = (next: Segment[]) => {
    setHistory((values) => [...values.slice(-40), clone(segmentsRef.current)]);
    setFuture([]);
    setSegments(next);
  };

  const updateSlide = (patch: Record<string, unknown>) => {
    if (!slide) return;
    apply(
      segments.map((current, index) =>
        index === selected.segmentIndex
          ? {
              ...current,
              slides: current.slides.map((item, slideIndex) =>
                slideIndex === selected.slideIndex
                  ? ({ ...item, ...patch } as Slide)
                  : item
              ),
            }
          : current
      )
    );
  };

  const updateSegment = (patch: Partial<Segment>) => {
    apply(
      segments.map((current, index) =>
        index === selected.segmentIndex ? { ...current, ...patch } : current
      )
    );
  };

  const addSlide = () => {
    if (!segment) return;
    const nextSlide: Slide = {
      kind: 'bullets',
      title: 'Novo slide',
      bullets: ['Novo item'],
    };
    const next = segments.map((current, index) => {
      if (index !== selected.segmentIndex) return current;
      const slides = [...current.slides];
      slides.splice(selected.slideIndex + 1, 0, nextSlide);
      return { ...current, slides };
    });
    apply(next);
    setSelected({ segmentIndex: selected.segmentIndex, slideIndex: selected.slideIndex + 1 });
  };

  const duplicateSlide = () => {
    if (!segment || !slide) return;
    const next = segments.map((current, index) => {
      if (index !== selected.segmentIndex) return current;
      const slides = [...current.slides];
      slides.splice(selected.slideIndex + 1, 0, clone(slide));
      return { ...current, slides };
    });
    apply(next);
    setSelected({ segmentIndex: selected.segmentIndex, slideIndex: selected.slideIndex + 1 });
  };

  const removeSlide = () => {
    if (!segment) return;
    if (segment.slides.length === 1) {
      if (segments.length === 1) return;
      const next = segments.filter((_, index) => index !== selected.segmentIndex);
      apply(next);
      setSelected({ segmentIndex: Math.max(0, selected.segmentIndex - 1), slideIndex: 0 });
      return;
    }
    const next = segments.map((current, index) =>
      index === selected.segmentIndex
        ? { ...current, slides: current.slides.filter((_, i) => i !== selected.slideIndex) }
        : current
    );
    apply(next);
    setSelected({
      segmentIndex: selected.segmentIndex,
      slideIndex: Math.max(0, selected.slideIndex - 1),
    });
  };

  const moveSlide = (direction: -1 | 1) => {
    if (!segment) return;
    const target = selected.slideIndex + direction;
    if (target < 0 || target >= segment.slides.length) return;
    const next = segments.map((current, index) => {
      if (index !== selected.segmentIndex) return current;
      const slides = [...current.slides];
      const [item] = slides.splice(selected.slideIndex, 1);
      slides.splice(target, 0, item);
      return { ...current, slides };
    });
    apply(next);
    setSelected({ segmentIndex: selected.segmentIndex, slideIndex: target });
  };

  const addSegment = () => {
    const nextSegment: Segment = {
      id: `bloco-${Date.now()}`,
      label: 'Novo bloco',
      minutes: 5,
      talk: [],
      do: [],
      slides: [{ kind: 'bullets', title: 'Novo slide', bullets: ['Novo item'] }],
    };
    const next = [...segments];
    next.splice(selected.segmentIndex + 1, 0, nextSegment);
    apply(next);
    setSelected({ segmentIndex: selected.segmentIndex + 1, slideIndex: 0 });
  };

  const removeSegmentAt = (index: number) => {
    if (segments.length === 1) return;
    apply(segments.filter((_, current) => current !== index));
    setSelected({ segmentIndex: Math.max(0, index - 1), slideIndex: 0 });
  };

  const moveSegmentAt = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= segments.length) return;
    const next = [...segments];
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    apply(next);
    setSelected({ segmentIndex: target, slideIndex: 0 });
  };

  const undo = () => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setFuture((values) => [clone(segmentsRef.current), ...values].slice(0, 40));
    setHistory((values) => values.slice(0, -1));
    setSegments(clone(previous));
  };

  const redo = () => {
    if (future.length === 0) return;
    const next = future[0];
    setHistory((values) => [...values.slice(-40), clone(segmentsRef.current)]);
    setFuture((values) => values.slice(1));
    setSegments(clone(next));
  };

  const selectedOccurrence = data?.occurrences.find(
    (row) => row.id === initialOccurrenceId
  );
  const occurrenceLocked =
    selectedOccurrence?.status === 'given' ||
    selectedOccurrence?.status === 'no_students' ||
    selectedOccurrence?.status === 'cancelled';

  if (error) {
    return (
      <main className="theme-dark game-shell min-h-dvh px-4 py-6 text-[var(--ink)] sm:px-8">
        <p className="mx-auto max-w-3xl rounded-2xl border-2 border-[var(--danger)]/60 bg-[var(--surface-2)] px-4 py-6 text-sm font-bold">
          Não foi possível carregar esta aula.
        </p>
      </main>
    );
  }

  if (!data || !ready) {
    return (
      <main className="theme-dark game-shell min-h-dvh px-4 py-6 text-[var(--ink)] sm:px-8">
        <p className="mx-auto max-w-3xl rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-6 text-sm font-bold text-[var(--muted)]">
          Carregando editor…
        </p>
      </main>
    );
  }

  return (
    <main className="theme-dark game-shell min-h-dvh px-3 py-4 text-[var(--ink)] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1600px]">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
              Editor · {contentId}
            </p>
            <h1 className="mt-1 truncate text-2xl font-black">{title || data.content.title}</h1>
            <p className="text-xs font-semibold text-[var(--muted)]">
              v{data.content.version} · {segments.length} blocos ·{' '}
              {segments.reduce((total, item) => total + item.slides.length, 0)} slides
              {occurrenceLocked ? ' · aula dada (somente leitura local)' : ''}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/professor/biblioteca`}
              className="flex items-center gap-2 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Biblioteca
            </Link>
            <button
              type="button"
              onClick={undo}
              disabled={history.length === 0}
              aria-label="Desfazer"
              className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--muted)] disabled:opacity-35"
            >
              <Undo2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={redo}
              disabled={future.length === 0}
              aria-label="Refazer"
              className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] p-2 text-[var(--muted)] disabled:opacity-35"
            >
              <Redo2 className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => setShowSave(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--cta-bg)] px-4 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              <Save className="h-4 w-4" aria-hidden="true" />
              Salvar
            </button>
          </div>
        </header>

        {message ? (
          <p className="mt-3 rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200">
            {message}
          </p>
        ) : null}

        {occurrenceLocked ? (
          <p className="mt-3 rounded-xl border border-amber-400/50 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200">
            Esta aula já foi dada: a edição local está bloqueada. Você ainda pode salvar como nova
            versão global para as próximas aulas.
          </p>
        ) : null}

        <div className="mt-4 grid gap-4 xl:grid-cols-[260px_minmax(0,1fr)_380px]">
          <aside className="max-h-[75vh] overflow-y-auto rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-2">
            <div className="mb-2 flex items-center justify-between gap-2 px-1">
              <span className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                Blocos
              </span>
              <button
                type="button"
                onClick={addSegment}
                className="rounded-lg bg-[var(--surface-2)] p-1 text-[var(--accent)]"
                aria-label="Adicionar bloco"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {segments.map((current, segmentIndex) => (
              <div
                key={current.id}
                className="mb-2 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-2)]/40 p-1.5"
              >
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setSelected({ segmentIndex, slideIndex: 0 })
                    }
                    className="min-w-0 flex-1 truncate text-left text-[10px] font-black"
                  >
                    {current.label}
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSegmentAt(segmentIndex, -1)}
                    className="p-0.5 text-[var(--muted)]"
                    aria-label="Mover bloco para cima"
                  >
                    <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSegmentAt(segmentIndex, 1)}
                    className="p-0.5 text-[var(--muted)]"
                    aria-label="Mover bloco para baixo"
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSegmentAt(segmentIndex)}
                    disabled={segments.length === 1}
                    className="p-0.5 text-[var(--muted)] disabled:opacity-30"
                    aria-label="Remover bloco"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>

                {current.slides.map((item, slideIndex) => {
                  const active =
                    segmentIndex === selected.segmentIndex &&
                    slideIndex === selected.slideIndex;
                  return (
                    <button
                      key={`${item.kind}-${slideIndex}`}
                      type="button"
                      onClick={() => setSelected({ segmentIndex, slideIndex })}
                      className={`mt-1 flex w-full items-center gap-1.5 rounded-lg px-1.5 py-1 text-left text-[10px] font-bold transition ${
                        active
                          ? 'bg-[var(--accent)] text-[#071018]'
                          : 'text-[var(--muted)] hover:bg-[var(--surface)]'
                      }`}
                    >
                      <span className="w-4 shrink-0 text-center">{slideIndex + 1}</span>
                      <span className="truncate">
                        {'title' in item ? String(item.title ?? '') : item.kind}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </aside>

          <section className="rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-4">
            {slide && segment ? (
              <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="rounded-full bg-[var(--surface-2)] px-2 py-1 text-[9px] font-black uppercase tracking-wide text-[var(--accent)]">
                    {slide.kind}
                  </span>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => moveSlide(-1)}
                      className="rounded-lg border border-[var(--line)] p-1 text-[var(--muted)]"
                      aria-label="Mover slide para cima"
                    >
                      <ChevronUp className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSlide(1)}
                      className="rounded-lg border border-[var(--line)] p-1 text-[var(--muted)]"
                      aria-label="Mover slide para baixo"
                    >
                      <ChevronDown className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={duplicateSlide}
                      className="rounded-lg border border-[var(--line)] p-1 text-[var(--muted)]"
                      aria-label="Duplicar slide"
                    >
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={removeSlide}
                      className="rounded-lg border border-[var(--line)] p-1 text-[var(--muted)]"
                      aria-label="Remover slide"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={addSlide}
                      className="rounded-lg border border-[var(--line)] p-1 text-[var(--accent)]"
                      aria-label="Adicionar slide"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <Field
                  label="Título"
                  value={String(slideData?.title ?? '')}
                  onChange={(value) => updateSlide({ title: value })}
                />
                <Field
                  label="Subtítulo"
                  value={String(slideData?.subtitle ?? '')}
                  onChange={(value) => updateSlide({ subtitle: value })}
                />
                <SlideFields slide={slide} update={updateSlide} />
                <TextArea
                  label="Nota da aula (Colinha)"
                  value={String(slideData?.note ?? '')}
                  onChange={(value) => updateSlide({ note: value })}
                  rows={3}
                />
                <TextArea
                  label="Nota exclusiva do professor"
                  value={String(slideData?.teacherNote ?? '')}
                  onChange={(value) => updateSlide({ teacherNote: value })}
                  rows={3}
                />

                <div className="grid gap-3 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-2)]/50 p-3 sm:grid-cols-2">
                  <Field
                    label="Nome do bloco"
                    value={segment.label}
                    onChange={(value) => updateSegment({ label: value })}
                  />
                  <Field
                    label="Minutos do bloco"
                    value={String(segment.minutes)}
                    onChange={(value) => updateSegment({ minutes: Number(value) || 0 })}
                  />
                  <TextArea
                    label="O que falar (talk)"
                    value={segment.talk.join('\n')}
                    onChange={(value) => updateSegment({ talk: lines(value) })}
                    rows={4}
                  />
                  <TextArea
                    label="O que fazer (do)"
                    value={segment.do.join('\n')}
                    onChange={(value) => updateSegment({ do: lines(value) })}
                    rows={4}
                  />
                </div>
              </div>
            ) : (
              <p className="text-sm font-bold text-[var(--muted)]">
                Selecione um slide à esquerda.
              </p>
            )}
          </section>

          <aside className="rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-2">
            <div className="overflow-hidden rounded-xl border border-[var(--line-soft)]">
              {slide ? <SlideStage slide={slide} /> : null}
            </div>
            <div className="mt-2 rounded-xl bg-[var(--surface-2)]/60 px-2 py-1.5 text-[10px] font-bold text-[var(--muted)]">
              <p>Título da aula</p>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs font-black text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
              <p className="mt-2">Duração (min)</p>
              <input
                type="number"
                value={totalMin}
                onChange={(event) => setTotalMin(Number(event.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs font-black text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </div>
          </aside>
        </div>
      </div>

      {showSave ? (
        <SaveScopeDialog
          content={data.content}
          occurrences={data.occurrences}
          classes={data.classes}
          segments={segments}
          title={title}
          totalMin={totalMin}
          initialOccurrenceId={initialOccurrenceId}
          onClose={() => setShowSave(false)}
          onSaved={(scope, version) => {
            setShowSave(false);
            setMessage(
              scope === 'global'
                ? `Nova versão global v${version ?? '?'} criada. Aulas dadas mantêm o snapshot.`
                : 'Edição local salva nesta aula.'
            );
          }}
        />
      ) : null}
    </main>
  );
}

export default function EditorPage() {
  return (
    <RequireProfessor>
      <EditorContent />
    </RequireProfessor>
  );
}
