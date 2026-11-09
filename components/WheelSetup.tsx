'use client';

import { motion } from 'motion/react';
import {
  ArrowLeft,
  Candy,
  Check,
  Clapperboard,
  Cpu,
  FlaskConical,
  Gamepad2,
  Ghost,
  Leaf,
  MapPin,
  Play,
  Puzzle,
  ShieldCheck,
  Skull,
  Trophy,
  Tv,
} from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { CLASSIC_CATEGORIES } from '@/lib/classic-questions';
import { DIFFICULTIES } from '@/lib/game';
import { categoryCopy, difficultyCopy } from '@/lib/i18n/game-copy';
import { EXTRA_GAMES_COPY } from '@/lib/i18n/extra-games-copy';
import type { Language } from '@/lib/i18n';
import type { ClassicCategoryId, DifficultyId } from '@/lib/types';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS = {
  games: Gamepad2,
  anime: Tv,
  'pop-culture': Clapperboard,
  tech: Cpu,
  'digital-safety': ShieldCheck,
  science: FlaskConical,
  nature: Leaf,
  brazil: MapPin,
  sports: Trophy,
  logic: Puzzle,
} as const;

const DIFFICULTY_ICONS = {
  easy: Candy,
  medium: Ghost,
  hard: Skull,
} as const;

type WheelSetupProps = {
  uiLanguage: Language;
  language: Language;
  difficulty: DifficultyId;
  categories: ClassicCategoryId[];
  onDifficultyChange: (difficulty: DifficultyId) => void;
  onCategoriesChange: (categories: ClassicCategoryId[]) => void;
  onLanguageChange: (language: Language) => void;
  onStart: () => void;
  onBack: () => void;
};

export default function WheelSetup({
  uiLanguage,
  language,
  difficulty,
  categories,
  onDifficultyChange,
  onCategoriesChange,
  onLanguageChange,
  onStart,
  onBack,
}: WheelSetupProps) {
  const copy = EXTRA_GAMES_COPY[uiLanguage].wheel;
  const canStart = categories.length > 0;

  const toggleCategory = (categoryId: ClassicCategoryId) => {
    onCategoriesChange(
      categories.includes(categoryId)
        ? categories.filter((id) => id !== categoryId)
        : [...categories, categoryId]
    );
  };

  return (
    <motion.main
      key="wheel-setup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="relative z-10 mx-auto flex min-h-dvh w-full max-w-5xl flex-col justify-center px-4 py-8 sm:px-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {copy.back}
        </button>
        <span className="rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
          {copy.badge}
        </span>
      </header>

      <header className="mt-6">
        <h1 className="text-balance text-4xl font-black uppercase leading-[0.95] tracking-tight text-[var(--ink)] sm:text-5xl">
          {copy.setupTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold text-[var(--muted)] sm:text-base">
          {copy.setupDescription}
        </p>
      </header>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <section className="rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface)] p-4 sm:p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
              {copy.topics}
            </h2>
            <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
              {categories.length}/{CLASSIC_CATEGORIES.length} {copy.selected}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {CLASSIC_CATEGORIES.map((category) => {
              const Icon = CATEGORY_ICONS[category.id];
              const selected = categories.includes(category.id);

              return (
                <button
                  key={category.id}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => toggleCategory(category.id)}
                  className={cn(
                    'rounded-xl border-2 p-3 text-left transition-colors',
                    selected
                      ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                      : 'border-[var(--line-soft)] bg-[var(--surface-2)] hover:border-[var(--line)]'
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <Icon
                      className={cn(
                        'h-4 w-4',
                        selected ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                      )}
                      aria-hidden="true"
                    />
                    {selected && (
                      <Check className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                    )}
                  </div>
                  <p className="mt-2 text-xs font-black leading-tight text-[var(--ink)]">
                    {categoryCopy(category.id, uiLanguage).label}
                  </p>
                </button>
              );
            })}
          </div>
          {categories.length === 0 && (
            <p className="mt-3 rounded-xl border-2 border-[var(--danger)] px-3 py-2 text-[11px] font-bold text-[var(--danger)]">
              {copy.selectTopic}
            </p>
          )}
        </section>

        <div className="flex flex-col gap-4">
          <section className="rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface)] p-4 sm:p-5">
            <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
              {copy.difficulty}
            </h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {DIFFICULTIES.map((item) => {
                const Icon = DIFFICULTY_ICONS[item.id];
                const selected = difficulty === item.id;
                const difficultyText = difficultyCopy(item.id, uiLanguage);

                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onDifficultyChange(item.id)}
                    className={cn(
                      'rounded-xl border-2 p-3 text-left transition-colors',
                      selected
                        ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                        : 'border-[var(--line-soft)] bg-[var(--surface-2)] hover:border-[var(--line)]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Icon
                        className={cn(
                          'h-4 w-4',
                          selected ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                        )}
                        aria-hidden="true"
                      />
                      <span className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                        {difficultyText.audience}
                      </span>
                    </div>
                    <p className="mt-2 text-sm font-black text-[var(--ink)]">
                      {difficultyText.label}
                    </p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                      {difficultyText.tagline}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                {copy.questionLanguage}
              </h2>
              <LanguageToggle
                language={language}
                onChange={onLanguageChange}
                label={copy.questionLanguage}
              />
            </div>
            <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[var(--muted)]">
              {copy.questionLanguageHelp}
            </p>
          </section>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
        <motion.button
          type="button"
          whileHover={canStart ? { scale: 1.02 } : undefined}
          whileTap={canStart ? { scale: 0.97 } : undefined}
          onClick={onStart}
          disabled={!canStart}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-6 text-base font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--panel-shadow)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 sm:w-auto sm:text-lg"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
          {copy.start}
        </motion.button>
      </div>
    </motion.main>
  );
}
