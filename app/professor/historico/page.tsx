'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import clsx from 'clsx';
import { ArrowLeft, ArrowUpRight, Clock } from 'lucide-react';
import ProfessorNav from '@/components/professor/ProfessorNav';
import RequireProfessor from '@/components/professor/RequireProfessor';
import { STATUS_LABEL } from '@/lib/agenda/types';
import { formatTime, isoDate } from '@/lib/agenda/calendar';

type HistoryRow = {
  id: string;
  date: string;
  startAt: string;
  endAt: string;
  status: string;
  classId: string | null;
  contentId: string | null;
  classCode: string;
  className: string;
  title: string;
  reportId: string | null;
  summary: string | null;
};

function statusClasses(status: string): string {
  if (status === 'given') return 'bg-emerald-400 text-[#071018]';
  if (status === 'no_students') return 'bg-slate-400 text-[#071018]';
  if (status === 'planned') return 'bg-sky-400 text-[#071018]';
  if (status === 'unplanned') return 'border border-dashed border-sky-400 text-sky-300';
  return 'bg-slate-500 text-white';
}

function longDate(iso: string): string {
  const label = new Date(`${iso}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function HistoryContent() {
  const [rows, setRows] = useState<HistoryRow[] | null>(null);
  const [error, setError] = useState(false);
  const [classFilter, setClassFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [query, setQuery] = useState('');
  const todayIso = useMemo(() => isoDate(new Date()), []);

  useEffect(() => {
    let active = true;
    fetch('/api/history', { cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) throw new Error('history');
        const payload = (await response.json()) as { rows?: HistoryRow[] };
        if (active) setRows(payload.rows ?? []);
      })
      .catch(() => {
        if (active) setError(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const classOptions = useMemo(
    () => Array.from(new Set((rows ?? []).map((row) => row.classCode))).sort(),
    [rows]
  );

  const filtered = useMemo(() => {
    const search = query.trim().toLowerCase();
    return (rows ?? []).filter((row) => {
      if (row.date > todayIso) return false;
      if (classFilter !== 'all' && row.classCode !== classFilter) return false;
      if (statusFilter !== 'all' && row.status !== statusFilter) return false;
      if (!search) return true;
      return (
        row.title.toLowerCase().includes(search) ||
        row.className.toLowerCase().includes(search) ||
        (row.summary ?? '').toLowerCase().includes(search)
      );
    });
  }, [rows, classFilter, statusFilter, query, todayIso]);

  const groups = useMemo(() => {
    const map = new Map<string, HistoryRow[]>();
    for (const row of filtered) {
      const list = map.get(row.date);
      if (list) list.push(row);
      else map.set(row.date, [row]);
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  return (
    <main className="theme-dark game-shell min-h-dvh px-4 py-6 text-[var(--ink)] sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
              Supp · Professor
            </p>
            <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">Histórico</h1>
            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
              Todas as aulas e class reports sincronizados.
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

        <div className="mt-6 flex flex-wrap items-center gap-2">
          <select
            value={classFilter}
            onChange={(event) => setClassFilter(event.target.value)}
            className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            aria-label="Filtrar por turma"
          >
            <option value="all">Todas as turmas</option>
            {classOptions.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            aria-label="Filtrar por status"
          >
            <option value="all">Todos os status</option>
            <option value="given">Dada</option>
            <option value="no_students">Sem alunos</option>
            <option value="missed">Não dada</option>
            <option value="cancelled">Cancelada</option>
          </select>

          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar aula, turma ou relato…"
            className="min-w-[220px] flex-1 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
          />

          <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
            {filtered.length} registros
          </span>
        </div>

        {rows === null && !error ? (
          <p className="mt-6 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-6 text-sm font-bold text-[var(--muted)]">
            Carregando histórico…
          </p>
        ) : error ? (
          <p className="mt-6 rounded-2xl border-2 border-[var(--danger)]/60 bg-[var(--surface-2)] px-4 py-6 text-sm font-bold text-[var(--ink)]">
            Não foi possível carregar o histórico agora.
          </p>
        ) : groups.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-6 text-sm font-semibold text-[var(--muted)]">
            Nenhum registro com esses filtros.
          </p>
        ) : (
          <div className="mt-6 space-y-7">
            {groups.map(([date, items]) => (
              <section key={date}>
                <div className="mb-2 flex items-end justify-between gap-2 border-b border-[var(--line-soft)] pb-1.5">
                  <h2 className="text-sm font-black">{longDate(date)}</h2>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
                    {items.length} {items.length === 1 ? 'aula' : 'aulas'}
                  </span>
                </div>

                <div className="space-y-2">
                  {items.map((row) => (
                    <article
                      key={row.id}
                      className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2.5"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span
                              className={clsx(
                                'rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wide',
                                statusClasses(row.status)
                              )}
                            >
                              {STATUS_LABEL[row.status] ?? row.status}
                            </span>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-[var(--muted)]">
                              <Clock className="h-3 w-3" aria-hidden="true" />
                              {formatTime(row.startAt)}–{formatTime(row.endAt)}
                            </span>
                            <span className="text-[11px] font-black">{row.classCode}</span>
                          </div>
                          <p className="mt-1 text-sm font-black">{row.title}</p>
                          <p className="text-[11px] font-semibold text-[var(--muted)]">
                            {row.className}
                          </p>
                        </div>

                        {row.contentId ? (
                          <Link
                            href={`/professor?aula=${row.id}`}
                            className="flex shrink-0 items-center gap-1 rounded-xl border-2 border-[var(--line)] px-2.5 py-1.5 text-[10px] font-black uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
                          >
                            Abrir
                            <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                          </Link>
                        ) : null}
                      </div>

                      {row.summary ? (
                        <details className="mt-2 rounded-xl bg-[var(--surface-2)]/60 px-2.5 py-1.5">
                          <summary className="cursor-pointer text-[10px] font-black uppercase tracking-wide text-[var(--accent)]">
                            Ver relato
                          </summary>
                          <p className="mt-1 whitespace-pre-line text-[11px] font-semibold leading-snug text-[var(--muted)]">
                            {row.summary}
                          </p>
                        </details>
                      ) : null}
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function HistoryPage() {
  return (
    <RequireProfessor>
      <HistoryContent />
    </RequireProfessor>
  );
}
