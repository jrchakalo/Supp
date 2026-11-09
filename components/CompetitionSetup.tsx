'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Candy,
  Check,
  Clapperboard,
  Cpu,
  Flame,
  FlaskConical,
  Gamepad2,
  Ghost,
  Info,
  Leaf,
  ListOrdered,
  MapPin,
  Play,
  Puzzle,
  ShieldCheck,
  Shuffle,
  Skull,
  Sparkles,
  Trash2,
  Trophy,
  Tv,
  UserPlus,
  Users,
} from 'lucide-react';
import {
  buildCompetitionPhases,
  createStudent,
  parseStudentNames,
} from '@/lib/competition';
import { CLASSIC_CATEGORIES } from '@/lib/classic-questions';
import { COMPETITION_COPY } from '@/lib/i18n/competition-copy';
import {
  categoryCopy,
  competitionLevelCopy,
  competitionLevels,
  localizePhase,
} from '@/lib/i18n/game-copy';
import LanguageToggle from './LanguageToggle';
import type { Language } from '@/lib/i18n';
import type {
  ClassicCategoryId,
  CompetitionConfig,
  ModeId,
  ProgressiveRounds,
  Student,
  StudentOrder,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const LEVEL_ICONS = {
  easy: Candy,
  medium: Ghost,
  hard: Skull,
  progressive: Flame,
} as const;

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

const MAX_NAME_LENGTH = 30;
const MAX_STUDENTS = 50;

type CompetitionSetupProps = {
  mode: ModeId;
  students: Student[];
  config: CompetitionConfig;
  categories: ClassicCategoryId[];
  language: Language;
  uiLanguage: Language;
  onStudentsChange: (students: Student[]) => void;
  onConfigChange: (config: CompetitionConfig) => void;
  onCategoriesChange: (categories: ClassicCategoryId[]) => void;
  onLanguageChange: (language: Language) => void;
  onStart: () => void;
  onBack: () => void;
};

export default function CompetitionSetup({
  mode,
  students,
  config,
  categories,
  language,
  uiLanguage,
  onStudentsChange,
  onConfigChange,
  onCategoriesChange,
  onLanguageChange,
  onStart,
  onBack,
}: CompetitionSetupProps) {
  const [nameInput, setNameInput] = useState('');
  const [message, setMessage] = useState<{ type: 'error' | 'notice'; text: string } | null>(
    null
  );

  const copy = COMPETITION_COPY[uiLanguage].setup;
  const levels = competitionLevels(uiLanguage);
  const levelMeta = competitionLevelCopy(config.level, uiLanguage);
  const phases = buildCompetitionPhases(
    config.level,
    config.progressiveRounds
  ).map((phase) => localizePhase(phase, uiLanguage));
  const firstPhase = phases[0];
  const lastPhase = phases[phases.length - 1];
  const isClassic = mode === 'classic';
  const canStart = students.length >= 2 && (!isClassic || categories.length > 0);

  const toggleCategory = (categoryId: ClassicCategoryId) => {
    onCategoriesChange(
      categories.includes(categoryId)
        ? categories.filter((id) => id !== categoryId)
        : [...categories, categoryId]
    );
  };

  const addStudents = () => {
    if (students.length >= MAX_STUDENTS) {
      setMessage({
        type: 'error',
        text: copy.maxStudents(MAX_STUDENTS),
      });
      return;
    }

    const parsed = parseStudentNames(nameInput);
    if (parsed.length === 0) {
      setMessage({ type: 'error', text: copy.typeName });
      return;
    }

    const existing = new Set(students.map((student) => student.name.toLowerCase()));
    const accepted: Student[] = [];
    const skipped: string[] = [];

    for (const name of parsed) {
      if (students.length + accepted.length >= MAX_STUDENTS) {
        skipped.push(name);
        continue;
      }
      if (name.length > MAX_NAME_LENGTH) {
        skipped.push(name);
        continue;
      }
      const key = name.toLowerCase();
      if (existing.has(key)) {
        skipped.push(name);
        continue;
      }
      existing.add(key);
      accepted.push(createStudent(name));
    }

    if (accepted.length === 0) {
      setMessage({
        type: 'error',
        text: copy.duplicates,
      });
      return;
    }

    onStudentsChange([...students, ...accepted]);
    setNameInput('');
    setMessage(
      skipped.length > 0
        ? {
            type: 'notice',
            text: copy.skipped(accepted.length, skipped.length),
          }
        : { type: 'notice', text: copy.added(accepted.length) }
    );
  };

  const removeStudent = (studentId: string) => {
    onStudentsChange(students.filter((student) => student.id !== studentId));
    setMessage(null);
  };

  const clearStudents = () => {
    onStudentsChange([]);
    setMessage({ type: 'notice', text: copy.cleared });
  };

  return (
    <motion.main
      key="competition-setup"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25 }}
      className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col gap-4 px-4 py-6 sm:px-8 sm:py-8"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          {copy.menu}
        </button>
        <span className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.16em] text-[var(--accent)]">
          <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
          {isClassic ? copy.competition : copy.halloweenCompetition}
        </span>
      </header>

      <div>
        <h1 className="text-balance text-3xl font-black uppercase leading-none tracking-tight text-[var(--ink)] sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-3 max-w-2xl text-sm font-semibold leading-relaxed text-[var(--muted)] sm:text-base">
          {copy.description}
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section
          aria-labelledby="roster-title"
          className="flex min-h-0 flex-col rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2
              id="roster-title"
              className="flex items-center gap-2 text-lg font-black uppercase tracking-tight text-[var(--ink)]"
            >
              <Users className="h-5 w-5 text-[var(--accent)]" aria-hidden="true" />
              {copy.students}
            </h2>
            <div className="flex items-center gap-2">
              <span className="rounded-full border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">
                {students.length}/{MAX_STUDENTS}
              </span>
              {students.length > 0 && (
                <button
                  type="button"
                  onClick={clearStudents}
                  className="rounded-lg border-2 border-[var(--line-soft)] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
                >
                  {copy.clear}
                </button>
              )}
            </div>
          </div>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              addStudents();
            }}
            className="mt-4 flex flex-col gap-2 sm:flex-row"
          >
            <label htmlFor="student-name" className="sr-only">
              {copy.studentName}
            </label>
            <input
              id="student-name"
              type="text"
              value={nameInput}
              onChange={(event) => setNameInput(event.target.value)}
              maxLength={500}
              placeholder={copy.namePlaceholder}
              autoComplete="off"
              className="h-12 min-w-0 flex-1 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 text-sm font-bold text-[var(--ink)] outline-none transition placeholder:font-semibold placeholder:text-[var(--muted)] focus:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            />
            <button
              type="submit"
              className="flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl border-2 border-[var(--line)] bg-[var(--cta-bg)] px-4 text-sm font-black uppercase tracking-wide text-[var(--cta-text)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <UserPlus className="h-4 w-4" aria-hidden="true" />
              {copy.add}
            </button>
          </form>

          <p className="mt-2 text-[11px] font-semibold leading-relaxed text-[var(--muted)]">
            {copy.tip}
          </p>

          {message && (
            <p
              role={message.type === 'error' ? 'alert' : 'status'}
              className={cn(
                'mt-3 rounded-xl border-2 px-3 py-2 text-xs font-bold',
                message.type === 'error'
                  ? 'border-[var(--danger)] text-[var(--danger)]'
                  : 'border-[var(--accent-2)] text-[var(--accent-2)]'
              )}
            >
              {message.text}
            </p>
          )}

          <div className="mt-4 min-h-0 flex-1">
            {students.length === 0 ? (
              <div className="flex h-full min-h-[180px] flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--line-soft)] bg-[var(--surface-2)] p-6 text-center">
                <Users className="h-9 w-9 text-[var(--muted)]" aria-hidden="true" />
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-[var(--ink)]">
                    {copy.noStudents}
                  </p>
                  <p className="mt-1 text-xs font-semibold leading-relaxed text-[var(--muted)]">
                    {copy.addTwo}
                  </p>
                </div>
              </div>
            ) : (
              <ol className="max-h-[46vh] space-y-2 overflow-y-auto pr-1">
                {students.map((student, index) => (
                  <motion.li
                    key={student.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-2"
                  >
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-[var(--line-soft)] text-[11px] font-black text-[var(--accent)]">
                      {index + 1}
                    </span>
                    <span
                      className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--ink)]"
                      title={student.name}
                    >
                      {student.name}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeStudent(student.id)}
                      aria-label={`${copy.remove} ${student.name}`}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] transition hover:bg-[var(--danger)]/15 hover:text-[var(--danger)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--danger)]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </motion.li>
                ))}
              </ol>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-4">
          {isClassic && (
            <section
              aria-labelledby="topics-title"
              className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] sm:p-6"
            >
              <div className="flex items-center justify-between gap-2">
                <h2
                  id="topics-title"
                  className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]"
                >
                  {copy.topics}
                </h2>
                <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                  {categories.length}/{CLASSIC_CATEGORIES.length}
                </span>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2">
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
                        'rounded-2xl border-2 p-3 text-left transition-colors',
                        selected
                          ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                          : 'border-[var(--line-soft)] bg-[var(--surface-2)] hover:border-[var(--line)]'
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <Icon
                          className={cn(
                            'h-5 w-5',
                            selected ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                          )}
                          aria-hidden="true"
                        />
                        {selected && (
                          <Check className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                        )}
                      </div>
                      <p className="mt-2 text-sm font-black text-[var(--ink)]">
                        {categoryCopy(category.id, uiLanguage).label}
                      </p>
                    </button>
                  );
                })}
              </div>

              {categories.length === 0 && (
                <p className="mt-2 rounded-xl border-2 border-[var(--danger)] px-3 py-2 text-[11px] font-bold text-[var(--danger)]">
                  {copy.selectTopic}
                </p>
              )}
            </section>
          )}

          <section
            aria-labelledby="level-title"
            className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] sm:p-6"
          >
            <h2
              id="level-title"
              className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              {copy.level}
            </h2>

            <div className="mt-3 grid grid-cols-2 gap-2">
              {levels.map((item) => {
                const Icon = LEVEL_ICONS[item.id];
                const selected = config.level === item.id;

                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    whileHover={{ y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => onConfigChange({ ...config, level: item.id })}
                    className={cn(
                      'rounded-2xl border-2 p-3 text-left transition-colors',
                      selected
                        ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-[var(--panel-shadow)]'
                        : 'border-[var(--line-soft)] bg-[var(--surface-2)] hover:border-[var(--line)]'
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <Icon
                        className={cn(
                          'h-5 w-5',
                          selected ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                        )}
                        aria-hidden="true"
                      />
                      {selected && <Check className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />}
                    </div>
                    <p className="mt-2 text-sm font-black text-[var(--ink)]">{item.label}</p>
                    <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                      {item.phasesLabel}
                    </p>
                    <p className="mt-1 hidden text-[11px] leading-snug text-[var(--muted)] sm:block">
                      {item.description}
                    </p>
                  </motion.button>
                );
              })}
            </div>

            {config.level === 'progressive' && (
              <div className="mt-3 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] p-3">
                <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                  {copy.roundsPerDifficulty}
                </p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {([2, 3] as ProgressiveRounds[]).map((rounds) => {
                    const selected = config.progressiveRounds === rounds;
                    return (
                      <button
                        key={rounds}
                        type="button"
                        aria-pressed={selected}
                        onClick={() =>
                          onConfigChange({ ...config, progressiveRounds: rounds })
                        }
                        className={cn(
                          'rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-wide transition',
                          selected
                            ? 'border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]'
                            : 'border-[var(--line-soft)] text-[var(--muted)] hover:border-[var(--line)]'
                        )}
                      >
                        {rounds === 2 ? copy.twoRounds : copy.threeRounds}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-3 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-[11px] font-semibold leading-relaxed text-[var(--muted)]">
              <span className="font-black uppercase tracking-wider text-[var(--accent)]">
                {levelMeta.label}:
              </span>{' '}
              {firstPhase?.shortLabel} → {lastPhase?.shortLabel}
            </div>
          </section>

          <section
            aria-labelledby="language-title"
            className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] sm:p-6"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2
                id="language-title"
                className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]"
              >
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

          <section
            aria-labelledby="order-title"
            className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] sm:p-6"
          >
            <h2
              id="order-title"
              className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              {copy.nextStudent}
            </h2>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {[
                {
                  id: 'sequential' as StudentOrder,
                  label: copy.inOrder,
                  description: copy.followList,
                  Icon: ListOrdered,
                },
                {
                  id: 'random' as StudentOrder,
                  label: copy.random,
                  description: copy.shuffle,
                  Icon: Shuffle,
                },
              ].map((item) => {
                const selected = config.order === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => onConfigChange({ ...config, order: item.id })}
                    className={cn(
                      'rounded-2xl border-2 p-3 text-left transition-colors',
                      selected
                        ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                        : 'border-[var(--line-soft)] bg-[var(--surface-2)] hover:border-[var(--line)]'
                    )}
                  >
                    <item.Icon
                      className={cn(
                        'h-5 w-5',
                        selected ? 'text-[var(--accent)]' : 'text-[var(--muted)]'
                      )}
                      aria-hidden="true"
                    />
                    <p className="mt-2 text-sm font-black text-[var(--ink)]">{item.label}</p>
                    <p className="text-[11px] font-semibold text-[var(--muted)]">
                      {item.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          <section
            aria-labelledby="rules-title"
            className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] sm:p-6"
          >
            <h2
              id="rules-title"
              className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              <Info className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              {copy.howItWorks}
            </h2>
            <ul className="mt-3 space-y-2 text-xs font-semibold leading-relaxed text-[var(--muted)]">
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-2)]" aria-hidden="true" />
                {copy.rule1}
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-2)]" aria-hidden="true" />
                {copy.rule2}
              </li>
              <li className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--danger)]" aria-hidden="true" />
                {copy.rule3}
              </li>
              <li className="flex gap-2">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                {copy.rule4}
              </li>
              <li className="flex gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                {copy.rule5}
              </li>
            </ul>
          </section>
        </div>
      </div>

      <div className="mt-auto flex flex-col gap-3 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
          <p className="font-black uppercase tracking-wider text-[var(--ink)]">
            {copy.summary(
              students.length,
              phases.length,
              config.order === 'random' ? copy.random : copy.inOrder
            )}
          </p>
          <p>
            {canStart
              ? copy.firstLast(
                  firstPhase?.shortLabel ?? '',
                  lastPhase?.shortLabel ?? ''
                )
              : copy.addTwoStart}
          </p>
        </div>
        <motion.button
          type="button"
          whileHover={canStart ? { scale: 1.02 } : undefined}
          whileTap={canStart ? { scale: 0.97 } : undefined}
          onClick={onStart}
          disabled={!canStart}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-6 text-base font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--panel-shadow)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 sm:w-auto"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
          {copy.start}
        </motion.button>
      </div>
    </motion.main>
  );
}
