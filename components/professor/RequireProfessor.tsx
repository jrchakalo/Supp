'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { AULA_GATE_STORAGE } from '@/lib/aula/sync';
import { readStorage } from '@/lib/storage';

/**
 * The cockpit gate is client-side. This wrapper keeps the history/library pages
 * consistent with /professor without duplicating the gate UI.
 */
export default function RequireProfessor({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (readStorage(AULA_GATE_STORAGE) === '1') {
      setReady(true);
      return;
    }
    window.location.replace('/professor');
  }, []);

  if (!ready) {
    return (
      <main className="theme-dark game-shell flex min-h-dvh items-center justify-center text-[var(--ink)]">
        <p className="text-sm font-bold text-[var(--muted)]">Abrindo…</p>
      </main>
    );
  }

  return <>{children}</>;
}
