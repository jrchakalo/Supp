'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  Copy,
  Eye,
  Layers,
  Loader2,
  Pencil,
  Play,
  Search,
  Users,
} from 'lucide-react';
import ProfessorNav from '@/components/professor/ProfessorNav';
import RequireProfessor from '@/components/professor/RequireProfessor';
import AssignLessonDialog from '@/components/library/AssignLessonDialog';
import { SlideStage } from '@/components/aula/SlideView';
import { fetchLibraryData, type LibraryContent, type LibraryData } from '@/lib/library/data';

const DISCIPLINES = [
  { id: 'coding-1', label: 'Coding I' },
  { id: 'coding-2', label: 'Coding II' },
  { id: 'info', label: 'Info Bilíngue' },
  { id: 'pse', label: 'PSE Coding' },
  { id: 'pse-teens', label: 'PSE Teens' },
];

function unitLabel(content: LibraryContent): string {
  if (content.unit_no) return `Projeto ${content.unit_no}`;
  if (content.discipline === 'info') return 'Info Bilíngue';
  if (content.discipline === 'pse') return 'PSE Coding';
  if (content.discipline === 'pse-teens') return 'PSE Teens';
  return 'Geral';
}

function beatsCount(content: LibraryContent): number {
  return content.segments.reduce((total, segment) => total + segment.slides.length, 0);
}

function LibraryContentPage() {
  const [data, setData] = useState<LibraryData | null>(null);
  const [error, setError] = useState(false);
  const [discipline, setDiscipline] = useState('all');
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState<LibraryContent | null>(null);
  const [assign, setAssign] = useState<LibraryContent | null>(null);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState('');
  const [context, setContext] = useState<{
    classId?: string;
    date?: string;
    contentId?: string;
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const classId = params.get('turma') ?? undefined;
    const date = params.get('data') ?? undefined;
    const contentId = params.get('content') ?? undefined;
    if (classId || date || contentId) setContext({ classId, date, contentId });
  }, []);

  useEffect(() => {
    if (!context || !data) return;
    const classroom = context.classId
      ? data.classes.find((row) => row.id === context.classId)
      : undefined;
    if (classroom) setDiscipline(classroom.discipline);
    if (context.contentId) {
      const content = data.contents.find((row) => row.id === context.contentId);
      if (content) setAssign(content);
    }
  }, [context, data]);

  useEffect(() => {
    let active = true;
    fetchLibraryData()
      .then((payload) => {
        if (active) setData(payload);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const groups = useMemo(() => {
    const search = query.trim().toLowerCase();
    const filtered = (data?.contents ?? []).filter((content) => {
      if (discipline !== 'all' && content.discipline !== discipline) return false;
      if (!search) return true;
      return (
        content.title.toLowerCase().includes(search) ||
        content.id.toLowerCase().includes(search) ||
        unitLabel(content).toLowerCase().includes(search)
      );
    });

    return DISCIPLINES.map((entry) => {
      const items = filtered.filter((content) => content.discipline === entry.id);
      const byUnit = new Map<string, LibraryContent[]>();
      for (const item of items) {
        const key = unitLabel(item);
        const list = byUnit.get(key);
        if (list) list.push(item);
        else byUnit.set(key, [item]);
      }
      return {
        discipline: entry,
        units: Array.from(byUnit.entries()).map(([label, contents]) => ({ label, contents })),
      };
    }).filter((group) => group.units.length > 0);
  }, [data, discipline, query]);

  const duplicateContent = async (content: LibraryContent) => {
    setDuplicatingId(content.id);
    setNotice('');
    try {
      const response = await fetch('/api/editor/content', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'duplicate', contentId: content.id }),
      });
      const payload = (await response.json()) as { contentId?: string; error?: string };
      if (!response.ok || !payload.contentId) {
        throw new Error(payload.error ?? 'Não foi possível duplicar.');
      }
      window.location.href = `/professor/editor/${payload.contentId}`;
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Não foi possível duplicar.');
      setDuplicatingId(null);
    }
  };

  const openStandalone = async (content: LibraryContent) => {
    setOpeningId(content.id);
    setNotice('');
    try {
      const response = await fetch('/api/occurrences', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ contentId: content.id }),
      });
      const payload = (await response.json()) as { occurrenceId?: string; error?: string };
      if (!response.ok || !payload.occurrenceId) {
        throw new Error(payload.error ?? 'Não foi possível abrir a aula.');
      }
      window.location.href = `/professor?aula=${payload.occurrenceId}`;
    } catch (cause) {
      setNotice(cause instanceof Error ? cause.message : 'Não foi possível abrir a aula.');
      setOpeningId(null);
    }
  };

  return (
    <main className="theme-dark game-shell min-h-dvh px-4 py-6 text-[var(--ink)] sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
              Supp · Professor
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Biblioteca</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
              Banco de aulas por disciplina e unit/projeto.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <ProfessorNav />
            <Link
              href="/professor"
              className="flex items-center gap-2 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Painel
            </Link>
          </div>
        </header>

        {context ? (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[var(--accent)]/60 bg-[var(--accent)]/10 px-4 py-3">
            <p className="text-xs font-bold text-[var(--ink)]">
              Escolhendo aula para{' '}
              <span className="font-black">
                {data?.classes.find((row) => row.id === context.classId)?.short_code ?? 'a turma'}
              </span>
              {context.date
                ? ` em ${new Date(`${context.date}T12:00:00`).toLocaleDateString('pt-BR')}`
                : ''}
              . Use “Dar aula” na aula escolhida para confirmar.
            </p>
            <button
              type="button"
              onClick={() => {
                setContext(null);
                window.history.replaceState(null, '', '/professor/biblioteca');
              }}
              className="rounded-lg border-2 border-[var(--line)] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]"
            >
              Limpar
            </button>
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <select
            value={discipline}
            onChange={(event) => setDiscipline(event.target.value)}
            className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            aria-label="Filtrar por disciplina"
          >
            <option value="all">Todas as disciplinas</option>
            {DISCIPLINES.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.label}
              </option>
            ))}
          </select>

          <label className="relative min-w-[220px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
              aria-hidden="true"
            />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por título, ID ou projeto…"
              aria-label="Buscar aulas"
              className="w-full rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] py-2 pl-9 pr-3 text-xs font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
            />
          </label>

          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
            {data ? `${data.contents.length} aulas` : 'Carregando…'}
          </span>
        </div>

        {notice ? (
          <p className="mt-3 rounded-xl border border-rose-400/60 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-200">
            {notice}
          </p>
        ) : null}

        {!data && !error ? (
          <p className="mt-6 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-6 text-sm font-bold text-[var(--muted)]">
            Carregando biblioteca…
          </p>
        ) : error ? (
          <p className="mt-6 rounded-2xl border-2 border-[var(--danger)]/60 bg-[var(--surface-2)] px-4 py-6 text-sm font-bold text-[var(--ink)]">
            Não foi possível carregar a biblioteca agora.
          </p>
        ) : groups.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-6 text-sm font-semibold text-[var(--muted)]">
            Nenhuma aula encontrada com esses filtros.
          </p>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map((group) => (
              <details key={group.discipline.id} open className="group">
                <summary className="mb-3 flex cursor-pointer list-none items-end justify-between gap-2 border-b border-[var(--line-soft)] pb-1.5">
                  <span className="flex items-center gap-2">
                    <span
                      aria-hidden="true"
                      className="text-lg font-black text-[var(--muted)] transition group-open:rotate-90"
                    >
                      ›
                    </span>
                    <h2 className="text-lg font-black">{group.discipline.label}</h2>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                    {group.units.reduce((total, unit) => total + unit.contents.length, 0)} aulas
                  </span>
                </summary>

                <div className="space-y-4">
                  {group.units.map((unit) => (
                    <details key={unit.label} open className="group/unit">
                      <summary className="mb-2 flex cursor-pointer list-none items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                        <span
                          aria-hidden="true"
                          className="text-sm transition group-open/unit:rotate-90"
                        >
                          ›
                        </span>
                        {unit.label}
                      </summary>
                      <div className="grid gap-3 md:grid-cols-2">
                        {unit.contents.map((content) => (
                          <article
                            key={content.id}
                            className="flex flex-col rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] p-4"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[var(--muted)]">
                                {content.lesson_no ? `Aula ${content.lesson_no}` : content.id}
                              </span>
                              <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide text-[var(--accent)]">
                                v{content.version}
                              </span>
                            </div>
                            <h3 className="mt-2 text-base font-black leading-tight">{content.title}</h3>
                            <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
                              {content.id}
                            </p>

                            <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-bold text-[var(--muted)]">
                              <span className="inline-flex items-center gap-1">
                                <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                                {content.total_min ?? 150} min
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <Layers className="h-3.5 w-3.5" aria-hidden="true" />
                                {content.segments.length} blocos
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
                                {beatsCount(content)} beats
                              </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => setAssign(content)}
                                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[var(--cta-text)]"
                              >
                                <Users className="h-3.5 w-3.5" aria-hidden="true" />
                                Dar aula
                              </button>
                              <button
                                type="button"
                                onClick={() => void openStandalone(content)}
                                disabled={openingId === content.id}
                                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)] disabled:opacity-50"
                              >
                                {openingId === content.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Play className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                                Sem turma
                              </button>
                              <button
                                type="button"
                                onClick={() => setPreview(content)}
                                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
                              >
                                <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                                Prévia
                              </button>
                              <button
                                type="button"
                                onClick={() => void duplicateContent(content)}
                                disabled={duplicatingId === content.id}
                                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)] disabled:opacity-50"
                              >
                                {duplicatingId === content.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                                )}
                                Duplicar
                              </button>
                              <Link
                                href={`/professor/editor/${content.id}`}
                                className="inline-flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] px-3 py-2 text-[10px] font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
                              >
                                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                                Editar
                              </Link>
                            </div>
                          </article>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {preview ? <PreviewDialog content={preview} onClose={() => setPreview(null)} /> : null}
      {assign && data ? (
        <AssignLessonDialog
          content={assign}
          classes={data.classes}
          initialClassId={context?.classId}
          initialDate={context?.date}
          onClose={() => setAssign(null)}
        />
      ) : null}
    </main>
  );
}

function PreviewDialog({
  content,
  onClose,
}: {
  content: LibraryContent;
  onClose: () => void;
}) {
  const firstSlide = content.segments[0]?.slides[0];
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/75 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Prévia da aula"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-4xl rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 shadow-2xl">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
              Prévia
            </p>
            <h2 className="mt-1 text-xl font-black">{content.title}</h2>
            <p className="text-[11px] font-semibold text-[var(--muted)]">{content.id}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border-2 border-[var(--line)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)]"
          >
            Fechar
          </button>
        </div>

        {firstSlide ? (
          <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--line-soft)]">
            <SlideStage slide={firstSlide} />
          </div>
        ) : (
          <p className="mt-3 rounded-xl bg-[var(--surface-2)] px-3 py-4 text-sm font-bold text-[var(--muted)]">
            Esta aula ainda não tem slides.
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {content.segments.map((segment) => (
            <span
              key={segment.id}
              className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-1 text-[9px] font-bold text-[var(--muted)]"
            >
              {segment.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  return (
    <RequireProfessor>
      <LibraryContentPage />
    </RequireProfessor>
  );
}
