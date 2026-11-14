'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  Copy,
  History,
  Loader2,
  Plus,
  Redo2,
  Save,
  ShieldAlert,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import RequireProfessor from '@/components/professor/RequireProfessor';
import SaveScopeDialog from '@/components/editor/SaveScopeDialog';
import { SlideStage } from '@/components/aula/SlideView';
import type { Segment, Slide } from '@/lib/passaporte-lessons';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';
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

const SLIDE_KINDS: Array<{ value: Slide['kind']; label: string }> = [
  { value: 'cover', label: 'Capa' },
  { value: 'bullets', label: 'Bullets' },
  { value: 'case', label: 'Caso' },
  { value: 'code', label: 'Código' },
  { value: 'table', label: 'Tabela' },
  { value: 'flash', label: 'Imagem flash' },
  { value: 'big', label: 'Frase grande' },
  { value: 'quiz', label: 'Quiz (lista)' },
  { value: 'question', label: 'Pergunta' },
  { value: 'answer', label: 'Resposta' },
];

function defaultSlide(kind: Slide['kind'], title = 'Novo slide'): Slide {
  switch (kind) {
    case 'cover':
      return { kind, title, subtitle: 'Subtítulo', chips: ['Tema'] };
    case 'case':
      return {
        kind,
        title,
        prompt: 'Descreva o caso…',
        options: [
          { text: 'Opção A' },
          { text: 'Opção B' },
          { text: 'Opção C' },
          { text: 'Opção D' },
        ],
        correct: 0,
      };
    case 'code':
      return { kind, title, code: '// cole o código aqui' };
    case 'table':
      return {
        kind,
        title,
        head: ['Coluna 1', 'Coluna 2'],
        rows: [['', ''], ['', '']],
      };
    case 'flash':
      return { kind, title, seconds: 3 };
    case 'big':
      return { kind, title, lines: ['Linha 1', 'Linha 2'] };
    case 'quiz':
      return { kind, title, bullets: ['Pergunta 1', 'Pergunta 2', 'Pergunta 3'] };
    case 'question':
      return {
        kind,
        title,
        question: 'Pergunta?',
        options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
      };
    case 'answer':
      return {
        kind,
        title,
        question: 'Pergunta?',
        options: ['Opção A', 'Opção B', 'Opção C', 'Opção D'],
        correctIndex: 0,
        explanation: 'Explique a resposta.',
      };
    case 'bullets':
    default:
      return { kind: 'bullets', title, bullets: ['Novo item'] };
  }
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
  const [showVersions, setShowVersions] = useState(false);
  const [versionsLoading, setVersionsLoading] = useState(false);
  const [versions, setVersions] = useState<
    Array<{
      version: number;
      title: string | null;
      total_min: number | null;
      author: string | null;
      created_at: string;
    }>
  >([]);
  const [showCorrection, setShowCorrection] = useState(false);
  const [correctionReason, setCorrectionReason] = useState('');
  const [correcting, setCorrecting] = useState(false);
  const [draft, setDraft] = useState<{
    title: string;
    totalMin: number;
    segments: Segment[];
    at: number;
  } | null>(null);
  const [newSlideKind, setNewSlideKind] = useState<Slide['kind']>('bullets');
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

    try {
      const raw = readStorage(`editor-draft:${contentId}`);
      if (raw) {
        const parsed = JSON.parse(raw) as {
          title?: unknown;
          totalMin?: unknown;
          segments?: unknown;
          at?: unknown;
        };
        if (
          Array.isArray(parsed.segments) &&
          JSON.stringify(parsed.segments) !== JSON.stringify(base)
        ) {
          setDraft({
            title: typeof parsed.title === 'string' ? parsed.title : data.content.title,
            totalMin:
              typeof parsed.totalMin === 'number'
                ? parsed.totalMin
                : (data.content.total_min ?? 150),
            segments: parsed.segments as Segment[],
            at: typeof parsed.at === 'number' ? parsed.at : Date.now(),
          });
        }
      }
    } catch {
      setDraft(null);
    }
  }, [data, contentId]);

  useEffect(() => {
    if (!ready || !data) return;
    const timer = window.setTimeout(() => {
      writeStorage(
        `editor-draft:${contentId}`,
        JSON.stringify({ title, totalMin, segments, at: Date.now() })
      );
    }, 800);
    return () => window.clearTimeout(timer);
  }, [ready, data, contentId, title, totalMin, segments]);

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
    const nextSlide = defaultSlide(newSlideKind);
    const next = segments.map((current, index) => {
      if (index !== selected.segmentIndex) return current;
      const slides = [...current.slides];
      slides.splice(selected.slideIndex + 1, 0, nextSlide);
      return { ...current, slides };
    });
    apply(next);
    setSelected({ segmentIndex: selected.segmentIndex, slideIndex: selected.slideIndex + 1 });
  };

  const changeSlideKind = (kind: Slide['kind']) => {
    if (!slide) return;
    const title = 'title' in slide ? slide.title : 'Novo slide';
    const next = defaultSlide(kind, title);
    apply(
      segments.map((current, index) =>
        index === selected.segmentIndex
          ? {
              ...current,
              slides: current.slides.map((item, slideIndex) =>
                slideIndex === selected.slideIndex ? next : item
              ),
            }
          : current
      )
    );
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

  const openVersions = async () => {
    setShowVersions(true);
    setVersionsLoading(true);
    try {
      const response = await fetch(`/api/editor/content?id=${encodeURIComponent(contentId)}`, {
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('versions');
      const payload = (await response.json()) as { versions?: typeof versions };
      setVersions(payload.versions ?? []);
    } catch {
      setVersions([]);
    } finally {
      setVersionsLoading(false);
    }
  };

  const restoreVersion = async (version: number) => {
    if (!window.confirm(`Restaurar a versão ${version} como uma nova versão?`)) return;
    setMessage('');
    try {
      const response = await fetch('/api/editor/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contentId, action: 'restore', version }),
      });
      if (!response.ok) throw new Error('restore');
      window.location.reload();
    } catch {
      setMessage('Não foi possível restaurar esta versão.');
    }
  };

  const submitCorrection = async () => {
    if (!selectedOccurrence || correctionReason.trim().length < 10) return;
    setCorrecting(true);
    try {
      const response = await fetch('/api/editor/occurrence', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          occurrenceId: selectedOccurrence.id,
          contentId,
          segments,
          correction: true,
          reason: correctionReason,
        }),
      });
      if (!response.ok) throw new Error('correction');
      setMessage('Registro corrigido e auditado. O snapshot da aula foi atualizado.');
      setShowCorrection(false);
      setCorrectionReason('');
    } catch {
      setMessage('Não foi possível corrigir o registro.');
    } finally {
      setCorrecting(false);
    }
  };

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
              onClick={() => void openVersions()}
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              <History className="h-4 w-4" aria-hidden="true" />
              Versões
            </button>
            {occurrenceLocked ? (
              <button
                type="button"
                onClick={() => setShowCorrection(true)}
                className="inline-flex items-center gap-2 rounded-xl border-2 border-amber-400/60 bg-amber-500/10 px-3 py-2 text-xs font-black uppercase tracking-wide text-amber-200"
              >
                <ShieldAlert className="h-4 w-4" aria-hidden="true" />
                Corrigir registro
              </button>
            ) : null}
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

        {draft ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sky-400/50 bg-sky-500/10 px-3 py-2">
            <p className="text-xs font-bold text-sky-100">
              Rascunho local encontrado ({new Date(draft.at).toLocaleString('pt-BR')}).
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setTitle(draft.title);
                  setTotalMin(draft.totalMin);
                  setSegments(clone(draft.segments));
                  setDraft(null);
                  setMessage('Rascunho local restaurado. Salve para publicar.');
                }}
                className="rounded-lg bg-sky-400 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-[#071018]"
              >
                Restaurar
              </button>
              <button
                type="button"
                onClick={() => {
                  removeStorage(`editor-draft:${contentId}`);
                  setDraft(null);
                }}
                className="rounded-lg border border-sky-400/50 px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-sky-100"
              >
                Descartar
              </button>
            </div>
          </div>
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

                <div className="grid gap-3 sm:grid-cols-2">
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
                </div>

                <div className="flex flex-wrap items-end gap-2">
                  <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
                    Tipo do slide
                    <select
                      value={slide.kind}
                      onChange={(event) => changeSlideKind(event.target.value as Slide['kind'])}
                      className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                    >
                      {SLIDE_KINDS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="flex min-w-[170px] flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
                    Novo slide
                    <select
                      value={newSlideKind}
                      onChange={(event) => setNewSlideKind(event.target.value as Slide['kind'])}
                      className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                    >
                      {SLIDE_KINDS.map((item) => (
                        <option key={item.value} value={item.value}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
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
                aria-label="Título da aula"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs font-black text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
              <p className="mt-2">Duração (min)</p>
              <input
                aria-label="Duração em minutos"
                type="number"
                value={totalMin}
                onChange={(event) => setTotalMin(Number(event.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-[var(--line)] bg-[var(--surface)] px-2 py-1 text-xs font-black text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </div>
          </aside>
        </div>
      </div>

      {showVersions ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Versões do conteúdo"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowVersions(false);
          }}
        >
          <div className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                  Histórico global
                </p>
                <h2 className="mt-1 text-xl font-black">Versões do conteúdo</h2>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  Restaurar cria uma nova versão; nada é apagado.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVersions(false)}
                aria-label="Fechar versões"
                className="rounded-full border-2 border-[var(--line)] p-1.5 text-[var(--muted)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {versionsLoading ? (
              <p className="mt-4 flex items-center gap-2 text-sm font-bold text-[var(--muted)]">
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                Carregando versões…
              </p>
            ) : versions.length === 0 ? (
              <p className="mt-4 text-sm font-semibold text-[var(--muted)]">
                Nenhuma versão registrada ainda.
              </p>
            ) : (
              <ol className="mt-4 space-y-2">
                {versions.map((item) => (
                  <li
                    key={item.version}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-black">
                        v{item.version}
                        {item.version === data.content.version ? ' · atual' : ''}
                      </p>
                      <p className="truncate text-[11px] font-semibold text-[var(--muted)]">
                        {new Date(item.created_at).toLocaleString('pt-BR')} ·{' '}
                        {item.author ?? 'professor'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => void restoreVersion(item.version)}
                      disabled={item.version === data.content.version}
                      className="rounded-lg border-2 border-[var(--line)] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--muted)] disabled:opacity-40"
                    >
                      Restaurar
                    </button>
                  </li>
                ))}
              </ol>
            )}
          </div>
        </div>
      ) : null}

      {showCorrection ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Corrigir registro"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCorrection(false);
          }}
        >
          <div className="w-full max-w-lg rounded-3xl border-2 border-amber-400/60 bg-[var(--surface)] p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-amber-300">
                  Aula dada
                </p>
                <h2 className="mt-1 text-xl font-black">Corrigir registro</h2>
                <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                  Isso altera o snapshot desta aula e grava o motivo na auditoria. Use apenas
                  para corrigir um erro real.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowCorrection(false)}
                aria-label="Fechar correção"
                className="rounded-full border-2 border-[var(--line)] p-1.5 text-[var(--muted)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
            <label className="mt-4 flex flex-col gap-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
              Motivo da correção
              <textarea
                value={correctionReason}
                onChange={(event) => setCorrectionReason(event.target.value)}
                rows={3}
                placeholder="Ex.: o slide de fechamento foi publicado com a turma errada."
                className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
              />
            </label>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCorrection(false)}
                className="rounded-xl border-2 border-[var(--line)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => void submitCorrection()}
                disabled={correcting || correctionReason.trim().length < 10}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-4 py-2 text-xs font-black uppercase tracking-wide text-[#071018] disabled:opacity-50"
              >
                {correcting ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
                Confirmar correção
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
            removeStorage(`editor-draft:${contentId}`);
            setDraft(null);
            setMessage(
              scope === 'global'
                ? `Nova versão global v${version ?? '?'} criada. Aulas dadas mantêm o snapshot.`
                : scope === 'class'
                  ? 'Edição salva para todas as aulas futuras desta turma.'
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
