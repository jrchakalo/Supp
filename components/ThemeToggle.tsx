'use client';

import { Moon, Sun } from 'lucide-react';
import type { Theme } from '@/lib/types';
import { cn } from '@/lib/utils';

type ThemeToggleProps = {
  theme: Theme;
  onChange: (theme: Theme) => void;
  className?: string;
};

export default function ThemeToggle({ theme, onChange, className }: ThemeToggleProps) {
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      title={isDark ? 'Light theme' : 'Dark theme'}
      onClick={() => onChange(isDark ? 'light' : 'dark')}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
        className
      )}
    >
      {isDark ? (
        <Sun className="h-4 w-4" aria-hidden="true" />
      ) : (
        <Moon className="h-4 w-4" aria-hidden="true" />
      )}
    </button>
  );
}
