'use client';

import { MousePointer2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isCursorVisible, setCursorVisible } from '@/lib/cursor';

export default function CursorToggle() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(isCursorVisible());
    const onToggle = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      if (typeof detail === 'boolean') setVisible(detail);
    };
    window.addEventListener('supp:cursor', onToggle);
    return () => window.removeEventListener('supp:cursor', onToggle);
  }, []);

  return (
    <button
      type="button"
      onClick={() => setCursorVisible(!visible)}
      title={visible ? 'Esconder cursor' : 'Mostrar cursor'}
      aria-label={visible ? 'Esconder cursor' : 'Mostrar cursor'}
      aria-pressed={visible}
      className="flex items-center gap-2 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
    >
      <MousePointer2 className="h-4 w-4" aria-hidden="true" />
      {visible ? 'Cursor visível' : 'Cursor oculto'}
    </button>
  );
}
