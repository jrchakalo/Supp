'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  Candy,
  Check,
  ChevronRight,
  Circle,
  Crown,
  Flame,
  Ghost,
  Play,
  RotateCcw,
  Skull,
  Sparkles,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import QuestionModal from './QuestionModal';
import VolumeControl from './VolumeControl';
import {
  buildCompetitionPhases,
  buildTiebreakPhase,
  drawPhaseQuestions,
  getCompetitionLevelMeta,
  orderStudents,
} from '@/lib/competition';
import type {
  AnswerStatus,
  ClassicCategoryId,
  CompetitionConfig,
  CompetitionPhase,
  ModeId,
  PhaseResult,
  Question,
  Student,
} from '@/lib/types';
import type { Language } from '@/lib/i18n';
import { cn } from '@/lib/utils';

const LEVEL_ICONS = {
  easy: Candy,
  medium: Ghost,
  hard: Skull,
  progressive: Flame,
} as const;

type CompetitionGameProps = {
  mode: ModeId;
  students: Student[];
  config: CompetitionConfig;
  categories: ClassicCategoryId[];
  language: Language;
  volume: number;
  muted: boolean;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  playTone: (
    frequency: number,
    type: OscillatorType,
    duration: number,
    level?: number
  ) => void;
  triggerConfetti: () => void;
  onExit: () => void;
  onPlayAgain: () => void;
  onOpenSetup: () => void;
};

type LineupStatus = 'pending' | 'current' | 'advanced' | 'eliminated';

function statusMeta(status: LineupStatus) {
  switch (status) {
    case 'advanced':
      return { label: 'Advanced', icon: Check, color: 'text-[var(--accent-2)]' };
    case 'eliminated':
      return { label: 'Eliminated', icon: X, color: 'text-[var(--danger)]' };
    case 'current':
      return { label: 'Now playing', icon: ChevronRight, color: 'text-[var(--accent)]' };
    default:
      return { label: 'Waiting', icon: Circle, color: 'text-[var(--muted)]' };
  }
}

export default function CompetitionGame({
  mode,
  students,
  config,
  categories,
  language,
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  playTone,
  triggerConfetti,
  onExit,
  onPlayAgain,
  onOpenSetup,
}: CompetitionGameProps) {
  const phases = useMemo(
    () => buildCompetitionPhases(config.level, config.progressiveRounds),
    [config.level, config.progressiveRounds]
  );
  const levelMeta = getCompetitionLevelMeta(config.level);
  const LevelIcon = LEVEL_ICONS[config.level];

  const [phaseIndex, setPhaseIndex] = useState(0);
  const [tiebreakRound, setTiebreakRound] = useState(0);
  const [activeStudents, setActiveStudents] = useState<Student[]>(students);
  const [phaseOrder, setPhaseOrder] = useState<Student[]>([]);
  const [phaseQuestions, setPhaseQuestions] = useState<Record<string, Question>>({});
  const [phaseResults, setPhaseResults] = useState<PhaseResult[]>([]);
  const [turnIndex, setTurnIndex] = useState(0);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>(null);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAnswers, setTotalAnswers] = useState(0);

  const usedQuestionIdsRef = useRef<Set<string>>(new Set());
  const acceptingAnswersRef = useRef(false);
  const advancingRef = useRef(false);
  const startedRef = useRef(false);
  const celebratedRef = useRef(false);
  const noChampionToneRef = useRef(false);

  const isTiebreak = tiebreakRound > 0;
  const lastPhase = phases[phases.length - 1];
  const tiebreakPhase = useMemo(
    () => (isTiebreak ? buildTiebreakPhase(lastPhase, tiebreakRound) : null),
    [isTiebreak, lastPhase, tiebreakRound]
  );
  const currentPhase = tiebreakPhase ?? phases[phaseIndex] ?? phases[0];

  const startPhase = useCallback(
    (phase: CompetitionPhase, roster: Student[]) => {
      const order = orderStudents(roster, config.order);
      const drawn = drawPhaseQuestions(phase, order, usedQuestionIdsRef.current, {
        mode,
        categories,
      });

      setPhaseOrder(order);
      setPhaseQuestions(
        Object.fromEntries(drawn.map(({ studentId, question }) => [studentId, question]))
      );
      setPhaseResults([]);
      setTurnIndex(0);
      setAnswerStatus(null);
      setIsQuestionOpen(false);
      acceptingAnswersRef.current = false;
      advancingRef.current = false;
    },
    [categories, config.order, mode]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    startPhase(phases[0], students);
  }, [phases, startPhase, students]);

  const phaseComplete = phaseOrder.length > 0 && turnIndex >= phaseOrder.length;
  const currentStudent = phaseComplete ? undefined : phaseOrder[turnIndex];
  const currentQuestion = currentStudent ? phaseQuestions[currentStudent.id] : undefined;

  const phaseSurvivors = useMemo(() => {
    const correctIds = new Set(
      phaseResults.filter((result) => result.correct).map((result) => result.studentId)
    );
    return activeStudents.filter((student) => correctIds.has(student.id));
  }, [activeStudents, phaseResults]);

  const eliminated = useMemo(() => {
    const answeredIds = new Set(phaseResults.map((result) => result.studentId));
    const correctIds = new Set(
      phaseResults.filter((result) => result.correct).map((result) => result.studentId)
    );
    return activeStudents.filter(
      (student) => answeredIds.has(student.id) && !correctIds.has(student.id)
    );
  }, [activeStudents, phaseResults]);

  const resultByStudent = useMemo(
    () => new Map(phaseResults.map((result) => [result.studentId, result])),
    [phaseResults]
  );

  const isLastPhase = phaseIndex >= phases.length - 1;
  const isComplete = phaseComplete && phaseSurvivors.length <= 1;
  const noChampion = phaseComplete && phaseSurvivors.length === 0;
  const champions = isComplete ? phaseSurvivors : [];
  const tiebreakNeeded =
    phaseComplete && !isTiebreak && isLastPhase && phaseSurvivors.length > 1;
  const tiebreakStillTied =
    phaseComplete && isTiebreak && phaseSurvivors.length > 1;

  useEffect(() => {
    if (!isComplete || champions.length === 0 || celebratedRef.current) return;
    celebratedRef.current = true;
    triggerConfetti();
    playTone(660, 'triangle', 0.16, 0.08);
    window.setTimeout(() => playTone(990, 'triangle', 0.2, 0.07), 120);
    window.setTimeout(() => playTone(1320, 'triangle', 0.24, 0.06), 240);
  }, [champions.length, isComplete, playTone, triggerConfetti]);

  useEffect(() => {
    if (!noChampion || noChampionToneRef.current) return;
    noChampionToneRef.current = true;
    playTone(150, 'sawtooth', 0.35, 0.07);
  }, [noChampion, playTone]);

  const openQuestion = useCallback(() => {
    if (!currentStudent || !currentQuestion || isQuestionOpen) return;

    acceptingAnswersRef.current = true;
    advancingRef.current = false;
    setAnswerStatus(null);
    setIsQuestionOpen(true);
    playTone(392, 'triangle', 0.09, 0.055);
  }, [currentQuestion, currentStudent, isQuestionOpen, playTone]);

  const handleAnswer = useCallback(
    (guess: boolean) => {
      if (!acceptingAnswersRef.current || !currentStudent || !currentQuestion || answerStatus) {
        return;
      }

      acceptingAnswersRef.current = false;
      const correct = guess === currentQuestion.answer;

      setAnswerStatus(correct ? 'correct' : 'incorrect');
      setPhaseResults((previous) => [
        ...previous,
        {
          studentId: currentStudent.id,
          studentName: currentStudent.name,
          questionId: currentQuestion.id,
          correct,
        },
      ]);
      setTotalAnswers((previous) => previous + 1);

      if (correct) {
        setTotalCorrect((previous) => previous + 1);
        playTone(660, 'triangle', 0.16, 0.08);
        window.setTimeout(() => playTone(990, 'triangle', 0.2, 0.07), 90);
        triggerConfetti();
      } else {
        playTone(150, 'sawtooth', 0.3, 0.07);
      }
    },
    [answerStatus, currentQuestion, currentStudent, playTone, triggerConfetti]
  );

  const closeQuestion = useCallback(() => {
    if (advancingRef.current) return;

    if (answerStatus) {
      advancingRef.current = true;
      setAnswerStatus(null);
      setIsQuestionOpen(false);
      setTurnIndex((previous) => previous + 1);
      playTone(300, 'sine', 0.06, 0.03);
      return;
    }

    acceptingAnswersRef.current = false;
    setIsQuestionOpen(false);
    playTone(300, 'sine', 0.06, 0.03);
  }, [answerStatus, playTone]);

  const nextPhase = useCallback(() => {
    if (!phaseComplete || isComplete) return;

    const survivors = phaseSurvivors;
    const nextRegularIndex = phaseIndex + 1;

    if (!isTiebreak && nextRegularIndex < phases.length) {
      setPhaseIndex(nextRegularIndex);
      setActiveStudents(survivors);
      startPhase(phases[nextRegularIndex], survivors);
    } else {
      const nextRound = tiebreakRound + 1;
      setTiebreakRound(nextRound);
      setActiveStudents(survivors);
      startPhase(buildTiebreakPhase(lastPhase, nextRound), survivors);
    }

    playTone(330, 'triangle', 0.1, 0.05);
  }, [
    isComplete,
    isTiebreak,
    lastPhase,
    phaseComplete,
    phaseIndex,
    phaseSurvivors,
    phases,
    playTone,
    startPhase,
    tiebreakRound,
  ]);

  const handleRestart = () => {
    if (window.confirm('Restart the competition? All progress will be lost.')) {
      onPlayAgain();
    }
  };

  const progress =
    phaseOrder.length > 0 ? Math.min(turnIndex, phaseOrder.length) : 0;
  const progressPercent =
    phaseOrder.length > 0 ? (progress / phaseOrder.length) * 100 : 0;
  const continueLabel =
    phaseResults.length >= phaseOrder.length
      ? language === 'pt'
        ? 'Ver resultado da fase'
        : 'See phase results'
      : language === 'pt'
        ? 'Próximo aluno'
        : 'Next student';
  const phaseSummaryEyebrow = tiebreakNeeded
    ? 'Final phase complete'
    : tiebreakStillTied
      ? `Tiebreak round ${tiebreakRound} complete`
      : `Phase ${phaseIndex + 1} complete`;
  const phaseSummaryTitle = tiebreakNeeded
    ? 'Tiebreaker needed'
    : tiebreakStillTied
      ? 'Still tied'
      : `${phaseSurvivors.length} advanced`;
  const phaseSummaryText = tiebreakNeeded
    ? `${phaseSurvivors.length} students survived the final phase. Start sudden death: one question each until one champion remains.`
    : tiebreakStillTied
      ? `${phaseSurvivors.length} students are still tied after round ${tiebreakRound}. Another sudden-death round will decide it.`
      : `${eliminated.length} student${eliminated.length === 1 ? '' : 's'} eliminated in this phase.`;
  const survivorsLabel =
    tiebreakNeeded || tiebreakStillTied ? 'Still in contention' : 'Advanced';
  const nextActionLabel = tiebreakNeeded
    ? 'Start tiebreaker'
    : tiebreakStillTied
      ? `Next tiebreak: Round ${tiebreakRound + 1}`
      : `Next phase: ${phases[phaseIndex + 1]?.shortLabel}`;

  return (
    <>
      <motion.div
        key="competition-game"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        inert={isQuestionOpen}
        className="relative z-10 flex min-h-dvh w-full flex-col"
      >
        <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-4 border-[var(--line)] bg-[var(--surface)] px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onExit}
              aria-label="Back to menu"
              className="flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Menu</span>
            </button>

            <div className="min-w-0">
              <h1 className="flex items-center gap-1.5 truncate text-base font-black uppercase tracking-tight text-[var(--ink)] sm:text-2xl">
                <LevelIcon className="h-4 w-4 shrink-0 text-[var(--accent)] sm:h-5 sm:w-5" aria-hidden="true" />
                {mode === 'classic' ? 'Competition' : 'Halloween Competition'}
              </h1>
              <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] sm:text-xs">
                {levelMeta.label} ·{' '}
                {isTiebreak
                  ? `Tiebreaker ${tiebreakRound}`
                  : `Phase ${phaseIndex + 1}/${phases.length}`}{' '}
                · {currentPhase?.label}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 text-[11px] font-black uppercase tracking-wider text-[var(--muted)]">
              <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              {activeStudents.length} in phase
            </span>

            <span className="hidden h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 text-[11px] font-black uppercase tracking-wider text-[var(--muted)] sm:flex">
              {config.order === 'random' ? 'Random order' : 'In order'}
            </span>

            <VolumeControl
              volume={volume}
              muted={muted}
              onVolumeChange={onVolumeChange}
              onToggleMute={onToggleMute}
            />

            <button
              type="button"
              onClick={handleRestart}
              aria-label="Restart competition"
              className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              <RotateCcw className="h-4 w-4" aria-hidden="true" />
              <span className="hidden sm:inline">Restart</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-3 sm:p-5">
          <div className="mx-auto grid w-full max-w-6xl gap-3 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.75fr)] lg:items-start">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center gap-2 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] sm:gap-3 sm:text-xs">
                <span className="whitespace-nowrap">Phase progress</span>
                <div
                  role="progressbar"
                  aria-label="Phase progress"
                  aria-valuemin={0}
                  aria-valuemax={Math.max(phaseOrder.length, 1)}
                  aria-valuenow={progress}
                  className="h-2 flex-1 overflow-hidden rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)]"
                >
                  <motion.div
                    className="h-full rounded-full bg-[var(--accent)]"
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ type: 'spring', stiffness: 180, damping: 26 }}
                  />
                </div>
                <span className="whitespace-nowrap">
                  {progress}/{phaseOrder.length || activeStudents.length}
                </span>
                <span className="hidden whitespace-nowrap text-[var(--accent)] sm:inline">
                  {totalCorrect}/{totalAnswers} correct
                </span>
              </div>

              {isComplete ? (
                noChampion ? (
                  <section
                    aria-live="polite"
                    className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 text-center shadow-[var(--panel-shadow)] sm:p-8"
                  >
                    <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-[var(--danger)]/60 text-[var(--danger)]">
                      <Skull className="h-8 w-8" aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--danger)]">
                      Competition over
                    </p>
                    <h2 className="mt-1 text-3xl font-black uppercase leading-none text-[var(--ink)] sm:text-5xl">
                      No champion this time
                    </h2>
                    <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-[var(--muted)] sm:text-base">
                      Everyone was eliminated in this phase. That is a tough ladder! Run a rematch
                      or go back to setup and try a different level.
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={onPlayAgain}
                        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-5 text-sm font-black uppercase tracking-wide text-[var(--cta-text)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Play again
                      </button>
                      <button
                        type="button"
                        onClick={onOpenSetup}
                        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--surface-2)] px-5 text-sm font-black uppercase tracking-wide text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                      >
                        <Users className="h-4 w-4" aria-hidden="true" />
                        New competition
                      </button>
                      <button
                        type="button"
                        onClick={onExit}
                        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line-soft)] px-5 text-sm font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Menu
                      </button>
                    </div>
                  </section>
                ) : (
                  <section
                    aria-live="polite"
                    className="rounded-3xl border-4 border-[var(--accent)] bg-[var(--surface)] p-6 text-center shadow-[var(--panel-shadow)] sm:p-8"
                  >
                    <span className="mx-auto flex h-20 w-20 items-center justify-center rounded-full border-4 border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)]">
                      <Crown className="h-10 w-10" aria-hidden="true" />
                    </span>
                    <p className="mt-4 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                      Champion!
                    </p>
                    <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
                      {champions.map((champion) => (
                        <h2
                          key={champion.id}
                          className="text-balance text-3xl font-black uppercase leading-none text-[var(--ink)] sm:text-5xl"
                        >
                          {champion.name}
                        </h2>
                      ))}
                    </div>
                    <p className="mt-4 text-sm font-semibold leading-relaxed text-[var(--muted)] sm:text-base">
                      {isTiebreak
                        ? `Won after ${tiebreakRound} tiebreak round${tiebreakRound === 1 ? '' : 's'}`
                        : `Survived ${phaseIndex + 1} of ${phases.length} phases`}{' '}
                      with{' '}
                      <span className="font-black text-[var(--ink)]">
                        {totalCorrect}/{totalAnswers}
                      </span>{' '}
                      correct answers.
                    </p>
                    <div className="mt-6 flex flex-col justify-center gap-2 sm:flex-row">
                      <button
                        type="button"
                        onClick={onPlayAgain}
                        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-5 text-sm font-black uppercase tracking-wide text-[var(--cta-text)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                      >
                        <RotateCcw className="h-4 w-4" aria-hidden="true" />
                        Play again
                      </button>
                      <button
                        type="button"
                        onClick={onOpenSetup}
                        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--surface-2)] px-5 text-sm font-black uppercase tracking-wide text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                      >
                        <Users className="h-4 w-4" aria-hidden="true" />
                        New competition
                      </button>
                      <button
                        type="button"
                        onClick={onExit}
                        className="flex min-h-[52px] items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line-soft)] px-5 text-sm font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]"
                      >
                        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                        Menu
                      </button>
                    </div>
                  </section>
                )
              ) : phaseComplete ? (
                <section
                  aria-live="polite"
                  className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--panel-shadow)] sm:p-7"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)]">
                      <Sparkles className="h-6 w-6" aria-hidden="true" />
                    </span>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                        {phaseSummaryEyebrow}
                      </p>
                      <h2 className="mt-1 text-2xl font-black uppercase leading-none text-[var(--ink)] sm:text-4xl">
                        {phaseSummaryTitle}
                      </h2>
                      <p className="mt-2 text-sm font-semibold leading-relaxed text-[var(--muted)]">
                        {phaseSummaryText}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <div className="rounded-2xl border-2 border-[var(--accent-2)]/50 bg-[var(--accent-2)]/10 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--accent-2)]">
                        {survivorsLabel}
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {phaseSurvivors.length === 0 ? (
                          <li className="text-xs font-semibold text-[var(--muted)]">
                            No one advanced.
                          </li>
                        ) : (
                          phaseSurvivors.map((student) => (
                            <li
                              key={student.id}
                              className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]"
                            >
                              <Check className="h-4 w-4 shrink-0 text-[var(--accent-2)]" aria-hidden="true" />
                              <span className="truncate">{student.name}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>

                    <div className="rounded-2xl border-2 border-[var(--danger)]/50 bg-[var(--danger)]/10 p-3">
                      <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--danger)]">
                        Eliminated
                      </p>
                      <ul className="mt-2 space-y-1.5">
                        {eliminated.length === 0 ? (
                          <li className="text-xs font-semibold text-[var(--muted)]">
                            No one was eliminated.
                          </li>
                        ) : (
                          eliminated.map((student) => (
                            <li
                              key={student.id}
                              className="flex items-center gap-2 text-sm font-bold text-[var(--ink)]"
                            >
                              <X className="h-4 w-4 shrink-0 text-[var(--danger)]" aria-hidden="true" />
                              <span className="truncate">{student.name}</span>
                            </li>
                          ))
                        )}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={nextPhase}
                    className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-6 text-sm font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--panel-shadow)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] sm:text-base"
                  >
                    {nextActionLabel}
                    <ChevronRight className="h-5 w-5" aria-hidden="true" />
                  </button>
                </section>
              ) : (
                <section className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-5 text-center shadow-[var(--panel-shadow)] sm:p-8">
                  <div className="flex flex-wrap items-center justify-center gap-2">
                    <span className="rounded-full border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">
                      Turn {Math.min(turnIndex + 1, phaseOrder.length)} of {phaseOrder.length}
                    </span>
                    <span className="rounded-full border-2 border-[var(--accent)]/50 bg-[var(--surface-2)] px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                      {currentPhase?.label}
                    </span>
                  </div>

                  <p className="mt-6 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--muted)]">
                    It&apos;s your turn
                  </p>
                  <h2 className="mt-2 text-balance text-4xl font-black uppercase leading-none tracking-tight text-[var(--ink)] sm:text-6xl">
                    {currentStudent?.name}
                  </h2>
                  <p className="mx-auto mt-3 max-w-xl text-sm font-semibold leading-relaxed text-[var(--muted)] sm:text-base">
                    The teacher reads the question aloud. Answer true or false to try to reach the
                    next phase.
                  </p>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={openQuestion}
                    disabled={isQuestionOpen}
                    className="mx-auto mt-6 flex min-h-[64px] w-full max-w-md items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-6 text-base font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--panel-shadow)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-60 sm:text-lg"
                  >
                    <Play className="h-5 w-5" aria-hidden="true" />
                    Reveal question
                  </motion.button>

                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted)]">
                    Tip: press T or F to answer · Esc closes the question
                  </p>
                </section>
              )}
            </div>

            <aside className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] sm:p-5">
              <div className="flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-2 text-sm font-black uppercase tracking-tight text-[var(--ink)]">
                  <Users className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                  Phase lineup
                </h2>
                <span className="rounded-full border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">
                  {phaseOrder.length}
                </span>
              </div>

              <ol className="mt-3 max-h-[52vh] space-y-1.5 overflow-y-auto pr-1">
                {phaseOrder.map((student, index) => {
                  const result = resultByStudent.get(student.id);
                  const isCurrent = !phaseComplete && index === turnIndex;
                  const status: LineupStatus = result
                    ? result.correct
                      ? 'advanced'
                      : 'eliminated'
                    : isCurrent
                      ? 'current'
                      : 'pending';
                  const meta = statusMeta(status);
                  const StatusIcon = meta.icon;

                  return (
                    <li
                      key={student.id}
                      className={cn(
                        'flex items-center gap-2 rounded-xl border-2 px-2.5 py-2 transition-colors',
                        status === 'current'
                          ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                          : 'border-[var(--line-soft)] bg-[var(--surface-2)]/60'
                      )}
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--line-soft)] text-[10px] font-black text-[var(--muted)]">
                        {index + 1}
                      </span>
                      <span
                        className={cn(
                          'min-w-0 flex-1 truncate text-xs font-bold',
                          status === 'eliminated'
                            ? 'text-[var(--muted)] line-through'
                            : 'text-[var(--ink)]'
                        )}
                        title={student.name}
                      >
                        {student.name}
                      </span>
                      <span className={cn('flex shrink-0 items-center gap-1 text-[9px] font-black uppercase tracking-wider', meta.color)}>
                        <StatusIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        <span className="hidden sm:inline">{meta.label}</span>
                      </span>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                    Advanced
                  </p>
                  <p className="text-lg font-black text-[var(--accent-2)]">
                    {phaseSurvivors.length}
                  </p>
                </div>
                <div className="rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-2">
                  <p className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                    Eliminated
                  </p>
                  <p className="text-lg font-black text-[var(--danger)]">{eliminated.length}</p>
                </div>
              </div>

              <p className="mt-3 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
                <Trophy className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                {totalCorrect}/{totalAnswers} correct overall
              </p>
            </aside>
          </div>
        </main>
      </motion.div>

      <AnimatePresence>
        {isQuestionOpen && currentQuestion && currentStudent && currentPhase && (
          <QuestionModal
            question={currentQuestion}
            studentName={currentStudent.name}
            phaseLabel={currentPhase.label}
            mode={mode}
            difficulty={currentPhase.difficulty}
            language={language}
            status={answerStatus}
            continueLabel={continueLabel}
            onAnswer={handleAnswer}
            onClose={closeQuestion}
          />
        )}
      </AnimatePresence>
    </>
  );
}
