'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import ProfessorNav from '@/components/professor/ProfessorNav';
import RequireProfessor from '@/components/professor/RequireProfessor';

function LibraryContent() {
  return (
    <main className="theme-dark game-shell min-h-dvh px-4 py-6 text-[var(--ink)] sm:px-8">
      <div className="mx-auto w-full max-w-5xl">
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

        <section className="mt-8 rounded-3xl border-2 border-dashed border-[var(--line)] bg-[var(--surface)] p-8 text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent)]">
            <BookOpen className="h-7 w-7" aria-hidden="true" />
          </span>
          <h2 className="mt-4 text-2xl font-black">Biblioteca em construção</h2>
          <p className="mx-auto mt-2 max-w-xl text-sm font-semibold text-[var(--muted)]">
            A próxima fase organiza as aulas por disciplina, projeto e unit, com busca, prévia e
            “dar aula” para uma turma/data. As 15 aulas já estão no modelo v2.
          </p>
        </section>
      </div>
    </main>
  );
}

export default function LibraryPage() {
  return (
    <RequireProfessor>
      <LibraryContent />
    </RequireProfessor>
  );
}
