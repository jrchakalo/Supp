'use client';

import type { Language } from '@/lib/i18n/types';
import { cn } from '@/lib/utils';

type LanguageToggleProps = {
  language: Language;
  onChange: (language: Language) => void;
  className?: string;
};

const OPTIONS: { id: Language; label: string; title: string }[] = [
  { id: 'pt', label: 'PT', title: 'Perguntas em português' },
  { id: 'en', label: 'EN', title: 'Questions in English' },
];

export default function LanguageToggle({
  language,
  onChange,
  className,
}: LanguageToggleProps) {
  return (
    <div
      role="group"
      aria-label="Question language"
      className={cn(
        'flex items-center gap-0.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] p-0.5',
        className
      )}
    >
      {OPTIONS.map((option) => {
        const selected = language === option.id;

        return (
          <button
            key={option.id}
            type="button"
            aria-pressed={selected}
            title={option.title}
            onClick={() => onChange(option.id)}
            className={cn(
              'rounded-lg px-2 py-1 text-[11px] font-black uppercase tracking-wide transition-colors',
              selected
                ? 'bg-[var(--cta-bg)] text-[var(--cta-text)]'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
