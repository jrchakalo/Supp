'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Trophy, Users } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import QuestionModal from './QuestionModal';
import VolumeControl from './VolumeControl';
import { getClassicDeck } from '@/lib/classic-questions';
import { getDeck } from '@/lib/game';
import { EXTRA_GAMES_COPY } from '@/lib/i18n/extra-games-copy';
import type { Language } from '@/lib/i18n';
import type {
  AnswerStatus,
  ClassicCategoryId,
  DifficultyId,
  ModeId,
  PassTargetScore,
  Question,
} from '@/lib/types';
import { cn } from '@/lib/utils';

const SECONDS_PER_TURN = 20;

type Phase = 'question' | 'steal' | 'reveal' | 'over';

type PassaRepassaGameProps = {
  mode: ModeId;
  teamNames: [string, string];
  targetScore: PassTargetScore;
  difficulty: DifficultyId;
  categories: ClassicCategoryId[];
  language: Language;
  uiLanguage: Language;
  volume: number;
  muted: boolean;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onLanguageChange: (language: Language) => void;
  playTone: (
    frequency: number,
    type: OscillatorType,
    duration: number,
    level?: number
  ) => void;
  triggerConfetti: () => void;
  onExit: () => void;
  onOpenSetup: () => void;
};

export default function PassaRepassaGame({
  mode,
  teamNames,
  targetScore,
  difficulty,
  categories,
  language,
  uiLanguage,
  volume,
  muted,
  onVolumeChange,
  onToggleMute,
  onLanguageChange,
  playTone,
  triggerConfetti,
  onExit,
  onOpenSetup,
}: PassaRepassaGameProps) {
  const copy = EXTRA_GAMES_COPY[uiLanguage].pass;

  const deck = useMemo(
    () =>
      mode === 'classic'
        ? getClassicDeck(difficulty, categories)
        : getDeck('halloween', difficulty),
    [categories, difficulty, mode]
  );

  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [starter, setStarter] = useState<0 | 1>(0);
  const [activeTeam, setActiveTeam] = useState<0 | 1>(0);
  const [phase, setPhase] = useState<Phase>('question');
  const [question, setQuestion] = useState<Question | null>(null);
  const [status, setStatus] = useState<AnswerStatus>(null);
  const [round, setRound] = useState(0);
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_TURN);
  const [winner, setWinner] = useState<0 | 1 | null>(null);

  const usedRef = useRef<Set<string>>(new Set());
  const startedRef = useRef(false);

  const drawQuestion = useCallback((): Question | null => {
    const fresh = deck.filter((item) => !usedRef.current.has(item.id));
    const pool = fresh.length > 0 ? fresh : deck;
    if (pool.length === 0) return null;

    const next = pool[Math.floor(Math.random() * pool.length)];
    usedRef.current.add(next.id);
    return next;
  }, [deck]);

  const beginRound = useCallback(
    (team: 0 | 1) => {
      const next = drawQuestion();
      if (!next) {
        setQuestion(null);
        setPhase('over');
        return;
      }

      setQuestion(next);
      setActiveTeam(team);
      setStatus(null);
      setPhase('question');
      setRound((value) => value + 1);
      setTimeLeft(SECONDS_PER_TURN);
    },
    [drawQuestion]
  );

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    beginRound(0);
  }, [beginRound]);

  /* Turn clock: a miss or timeout gives the other team a steal chance. */
  useEffect(() => {
    if (phase !== 'question' && phase !== 'steal') return;

    const deadline = Date.now() + SECONDS_PER_TURN * 1000;
    const tick = window.setInterval(() => {
      setTimeLeft(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 250);

    const timeout = window.setTimeout(() => {
      if (phase === 'question') {
        setActiveTeam((team) => (team === 0 ? 1 : 0));
        setStatus(null);
        setTimeLeft(SECONDS_PER_TURN);
        setPhase('steal');
        playTone(220, 'sawtooth', 0.2, 0.05);
      } else {
        setStatus('incorrect');
        setPhase('reveal');
        playTone(150, 'sawtooth', 0.3, 0.07);
      }
    }, SECONDS_PER_TURN * 1000);

    return () => {
      window.clearInterval(tick);
      window.clearTimeout(timeout);
    };
  }, [phase, question?.id, playTone]);

  const answer = useCallback(
    (guess: boolean) => {
      if (!question || status || phase === 'reveal' || phase === 'over') return;

      const correct = guess === question.answer;
      const other: 0 | 1 = activeTeam === 0 ? 1 : 0;

      if (phase === 'question') {
        if (correct) {
          const nextScore = scores[activeTeam] + 1;
          setScores((previous) => {
            const next: [number, number] = [previous[0], previous[1]];
            next[activeTeam] = nextScore;
            return next;
          });
          setStatus('correct');
          setPhase('reveal');
          if (nextScore >= targetScore) setWinner(activeTeam);
          playTone(660, 'triangle', 0.16, 0.08);
          window.setTimeout(() => playTone(990, 'triangle', 0.2, 0.07), 90);
          triggerConfetti();
        } else {
          setActiveTeam(other);
          setStatus(null);
          setTimeLeft(SECONDS_PER_TURN);
          setPhase('steal');
          playTone(220, 'sawtooth', 0.2, 0.05);
        }
        return;
      }

      if (correct) {
        const nextScore = scores[activeTeam] + 1;
        setScores((previous) => {
          const next: [number, number] = [previous[0], previous[1]];
          next[activeTeam] = nextScore;
          return next;
        });
        setStatus('correct');
        setPhase('reveal');
        if (nextScore >= targetScore) setWinner(activeTeam);
        playTone(660, 'triangle', 0.16, 0.08);
        window.setTimeout(() => playTone(990, 'triangle', 0.2, 0.07), 90);
        triggerConfetti();
      } else {
        setStatus('incorrect');
        setPhase('reveal');
        playTone(150, 'sawtooth', 0.3, 0.07);
      }
    },
    [activeTeam, phase, playTone, question, scores, status, targetScore, triggerConfetti]
  );

  const continueGame = useCallback(() => {
    if (phase !== 'reveal') return;

    if (winner !== null) {
      setPhase('over');
      return;
    }

    const nextStarter: 0 | 1 = starter === 0 ? 1 : 0;
    setStarter(nextStarter);
    beginRound(nextStarter);
  }, [beginRound, phase, starter, winner]);

  const closeQuestion = useCallback(() => {
    if (status) {
      continueGame();
      return;
    }

    if (phase === 'question') {
      setActiveTeam((team) => (team === 0 ? 1 : 0));
      setTimeLeft(SECONDS_PER_TURN);
      setPhase('steal');
    } else if (phase === 'steal') {
      setStatus('incorrect');
      setPhase('reveal');
    }
  }, [continueGame, phase, status]);

  const playAgain = useCallback(() => {
    usedRef.current.clear();
    setScores([0, 0]);
    setStarter(0);
    setActiveTeam(0);
    setWinner(null);
    setRound(0);
    setStatus(null);
    setPhase('question');
    beginRound(0);
  }, [beginRound]);

  const teamColor = (team: 0 | 1) => (team === 0 ? '#1368ce' : '#e21b3c');
  const currentName = teamNames[activeTeam];
  const turnLabel =
    phase === 'steal'
      ? copy.stealTurn(currentName)
      : copy.yourTurn(currentName);

  if (phase === 'over') {
    const champion = winner ?? (scores[0] >= scores[1] ? 0 : 1);
    return (
      <motion.main
        key="passa-over"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="relative z-10 mx-auto flex min-h-dvh w-full max-w-4xl flex-col items-center justify-center px-4 py-8 text-center sm:px-8"
      >
        <div className="w-full rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--panel-shadow)] sm:p-10">
          <Trophy className="mx-auto h-14 w-14 text-[var(--accent)]" aria-hidden="true" />
          <p className="mt-4 text-xs font-black uppercase tracking-[0.22em] text-[var(--muted)]">
            {copy.matchOver}
          </p>
          <h1 className="mt-2 text-4xl font-black uppercase leading-none text-[var(--ink)] sm:text-6xl">
            {copy.winner(teamNames[champion])}
          </h1>
          <p className="mt-3 text-3xl font-black tabular-nums text-[var(--accent)] sm:text-5xl">
            {copy.finalScore(scores[0], scores[1])}
          </p>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {[0, 1].map((team) => (
              <div
                key={team}
                className="rounded-2xl border-2 px-4 py-3"
                style={{ borderColor: teamColor(team as 0 | 1) }}
              >
                <p className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
                  {teamNames[team]}
                </p>
                <p className="text-3xl font-black tabular-nums text-[var(--ink)]">
                  {scores[team]}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={playAgain}
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-6 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              <RotateCcw className="h-5 w-5" aria-hidden="true" />
              {copy.playAgain}
            </button>
            <button
              type="button"
              onClick={onOpenSetup}
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-6 text-base font-black uppercase tracking-wide text-[var(--ink)]"
            >
              {copy.newSetup}
            </button>
            <button
              type="button"
              onClick={onExit}
              className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-[var(--line-soft)] px-6 text-base font-black uppercase tracking-wide text-[var(--muted)]"
            >
              {copy.menu}
            </button>
          </div>
        </div>
      </motion.main>
    );
  }

  return (
    <motion.main
      key="passa-game"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-3 py-4 sm:px-6 sm:py-6"
    >
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 sm:px-4 sm:py-3">
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onExit}
            aria-label={copy.menu}
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{copy.menu}</span>
          </button>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black uppercase tracking-tight text-[var(--ink)] sm:text-xl">
              {copy.badge}
            </h1>
            <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">
              {copy.round} {round} · {copy.targetLabel(targetScore)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <LanguageToggle
            language={language}
            onChange={onLanguageChange}
            label={copy.questionLanguage}
          />
          <VolumeControl
            volume={volume}
            muted={muted}
            uiLanguage={uiLanguage}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
          />
          <button
            type="button"
            onClick={onOpenSetup}
            className="rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-2 text-[11px] font-black uppercase text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {copy.newSetup}
          </button>
        </div>
      </header>

      <section aria-label={copy.score} className="mt-4 grid grid-cols-[1fr_auto_1fr] items-stretch gap-2 sm:gap-4">
        {[0, 1].map((team) => {
          const teamIndex = team as 0 | 1;
          const active = activeTeam === teamIndex;
          return (
            <div
              key={team}
              className={cn(
                'rounded-2xl border-4 bg-[var(--surface)] p-3 transition-all sm:p-5',
                active
                  ? 'scale-[1.01] shadow-[var(--panel-shadow)]'
                  : 'opacity-80'
              )}
              style={{ borderColor: teamColor(teamIndex) }}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="truncate text-xs font-black uppercase tracking-wider text-[var(--muted)] sm:text-sm">
                  {teamNames[teamIndex]}
                </p>
                {active && (
                  <span className="rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-white" style={{ backgroundColor: teamColor(teamIndex) }}>
                    {phase === 'steal' ? copy.steal : copy.turn}
                  </span>
                )}
              </div>
              <p className="mt-1 text-4xl font-black tabular-nums text-[var(--ink)] sm:text-6xl">
                {scores[teamIndex]}
              </p>
            </div>
          );
        })}
        <div className="flex items-center justify-center">
          <span className="rounded-full border-2 border-[var(--line)] bg-[var(--surface-2)] px-2 py-1 text-[10px] font-black uppercase tracking-wider text-[var(--muted)] sm:px-3 sm:text-xs">
            VS
          </span>
        </div>
      </section>

      <section className="mt-4 flex flex-1 flex-col items-center justify-center rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface)] p-5 text-center sm:p-8">
        <Users className="h-8 w-8 text-[var(--accent)]" aria-hidden="true" />
        <p className="mt-3 text-xs font-black uppercase tracking-[0.22em] text-[var(--muted)]">
          {phase === 'steal' ? copy.steal : copy.round}
        </p>
        <h2 className="mt-2 text-3xl font-black uppercase leading-tight text-[var(--ink)] sm:text-5xl">
          {turnLabel}
        </h2>
        <div className="mt-5 flex items-center gap-3">
          <span className="text-xs font-black uppercase tracking-wider text-[var(--muted)]">
            {copy.timeLeft}
          </span>
          <div className="h-3 w-40 overflow-hidden rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] sm:w-64">
            <div
              className={cn(
                'h-full rounded-full transition-[width] duration-200',
                timeLeft <= 5 ? 'bg-[var(--danger)]' : 'bg-[var(--accent)]'
              )}
              style={{ width: `${Math.max(0, Math.min(100, (timeLeft / SECONDS_PER_TURN) * 100))}%` }}
            />
          </div>
          <span className="w-8 text-left text-lg font-black tabular-nums text-[var(--ink)]">
            {timeLeft}
          </span>
        </div>
        <p className="mt-4 max-w-md text-xs font-semibold leading-relaxed text-[var(--muted)]">
          {phase === 'steal' ? copy.stealHint : copy.rule1}
        </p>
      </section>

      {question ? (
        <QuestionModal
          question={question}
          diceNumber={round}
          numberLabel={copy.round}
          timeLeft={timeLeft}
          timeLimit={SECONDS_PER_TURN}
          studentName={teamNames[activeTeam]}
          phaseLabel={turnLabel}
          mode={mode}
          difficulty={difficulty}
          language={language}
          status={status}
          continueLabel={winner !== null ? copy.matchOver : copy.next}
          onAnswer={answer}
          onClose={closeQuestion}
        />
      ) : null}
    </motion.main>
  );
}
