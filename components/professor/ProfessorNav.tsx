'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';

const TABS = [
  { href: '/professor', label: 'Painel' },
  { href: '/professor/biblioteca', label: 'Biblioteca' },
  { href: '/professor/historico', label: 'Histórico' },
];

export default function ProfessorNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-1 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)]/60 p-1">
      {TABS.map((tab) => {
        const active =
          tab.href === '/professor'
            ? pathname === '/professor'
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={clsx(
              'rounded-xl px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.14em] transition',
              active
                ? 'bg-[var(--accent)] text-[#071018]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
