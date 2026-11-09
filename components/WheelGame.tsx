'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RotateCcw, Sparkles, Trophy } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import QuestionModal from './QuestionModal';
import VolumeControl from './VolumeControl';
import { CLASSIC_ALL_CATEGORIES, getClassicDeck } from '@/lib/classic-questions';
import { categoryCopy } from '@/lib/i18n/game-copy';
import { EXTRA_GAMES_COPY } from '@/lib/i18n/extra-games-copy';
import type { Language } from '@/lib/i18n';
import type {
  AnswerStatus,
  ClassicCategoryId,
  DifficultyId,
  ModeId,
  Question,
} from '@/lib/types';

const WHEEL_COLORS = [
  '#e21b3c',
  '#1368ce',
  '#d89e00',
  '#26890c',
  '#7c3aed',
  '#0e7490',
  '#b45309',
  '#be185d',
  '#4338ca',
  '#047857',
];

const SHORT_LABELS: Record<ClassicCategoryId, { pt: string; en: string }> = {
  games: { pt: 'Jogos', en: 'Games' },
  anime: { pt: 'Anime', en: 'Anime' },
  'pop-culture': { pt: 'Cultura pop', en: 'Pop culture' },
  tech: { pt: 'Tecnologia', en: 'Technology' },
  'digital-safety': { pt: 'Segurança', en: 'Safety' },
  science: { pt: 'Ciência', en: 'Science' },
  nature: { pt: 'Natureza', en: 'Nature' },
  brazil: { pt: 'Brasil', en: 'Brazil' },
  sports: { pt: 'Esportes', en: 'Sports' },
  logic: { pt: 'Lógica', en: 'Logic' },
};

type WheelGameProps = {
  mode: ModeId;
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

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)] as const;
}

export default function WheelGame({
  mode,
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
}: WheelGameProps) {
  const copy = EXTRA_GAMES_COPY[uiLanguage].wheel;
  const wheelCategories = useMemo(
    () => (categories.length > 0 ? categories : CLASSIC_ALL_CATEGORIES),
    [categories]
  );

  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [picked, setPicked] = useState<ClassicCategoryId | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [status, setStatus] = useState<AnswerStatus>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [round, setRound] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const usedRef = useRef<Set<string>>(new Set());
  const spinTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current);
    };
  }, []);

  const drawQuestion = useCallback(
    (category: ClassicCategoryId): Question | null => {
      const deck = getClassicDeck(difficulty, [category]);
      const fresh = deck.filter((item) => !usedRef.current.has(item.id));
      const pool = fresh.length > 0 ? fresh : deck;
      if (pool.length === 0) return null;

      const next = pool[Math.floor(Math.random() * pool.length)];
      usedRef.current.add(next.id);
      return next;
    },
    [difficulty]
  );

  const spin = useCallback(() => {
    if (spinning || isModalOpen || wheelCategories.length === 0) return;

    const index = Math.floor(Math.random() * wheelCategories.length);
    const segmentAngle = 360 / wheelCategories.length;
    const center = index * segmentAngle + segmentAngle / 2;
    const normalized = ((rotation % 360) + 360) % 360;
    const desired = (360 - center + 360) % 360;
    const delta = (desired - normalized + 360) % 360;
    const nextRotation = rotation + 360 * 5 + delta;

    setRotation(nextRotation);
    setSpinning(true);
    setPicked(null);
    playTone(320, 'triangle', 0.08, 0.04);

    if (spinTimerRef.current) window.clearTimeout(spinTimerRef.current);
    spinTimerRef.current = window.setTimeout(() => {
      spinTimerRef.current = null;
      setSpinning(false);
      const category = wheelCategories[index];
      setPicked(category);
      const nextQuestion = drawQuestion(category);
      if (!nextQuestion) {
        setQuestion(null);
        setIsModalOpen(false);
        return;
      }
      setQuestion(nextQuestion);
      setStatus(null);
      setRound((value) => value + 1);
      setIsModalOpen(true);
      playTone(660, 'triangle', 0.16, 0.07);
    }, 3200);
  }, [drawQuestion, isModalOpen, playTone, rotation, spinning, wheelCategories]);

  const handleAnswer = useCallback(
    (guess: boolean) => {
      if (!question || status) return;

      const correct = guess === question.answer;
      setStatus(correct ? 'correct' : 'incorrect');
      setScore((previous) => ({
        correct: previous.correct + (correct ? 1 : 0),
        total: previous.total + 1,
      }));

      if (correct) {
        playTone(660, 'triangle', 0.16, 0.08);
        window.setTimeout(() => playTone(990, 'triangle', 0.2, 0.07), 90);
        triggerConfetti();
      } else {
        playTone(150, 'sawtooth', 0.3, 0.07);
      }
    },
    [playTone, question, status, triggerConfetti]
  );

  const closeQuestion = useCallback(() => {
    setIsModalOpen(false);
    setQuestion(null);
    setStatus(null);
  }, []);

  const newRound = useCallback(() => {
    usedRef.current.clear();
    setScore({ correct: 0, total: 0 });
    setRound(0);
    setPicked(null);
    setRotation(0);
    setSpinning(false);
    setQuestion(null);
    setStatus(null);
    setIsModalOpen(false);
  }, []);

  const segmentAngle = 360 / wheelCategories.length;
  const segments = wheelCategories.map((category, index) => {
    const start = index * segmentAngle;
    const end = (index + 1) * segmentAngle;
    const [x1, y1] = polar(50, 50, 46, start);
    const [x2, y2] = polar(50, 50, 46, end);
    const mid = start + segmentAngle / 2;
    const [tx, ty] = polar(50, 50, 31, mid);

    return {
      category,
      color: WHEEL_COLORS[index % WHEEL_COLORS.length],
      path: `M50 50 L ${x1.toFixed(3)} ${y1.toFixed(3)} A 46 46 0 ${segmentAngle > 180 ? 1 : 0} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`,
      label: SHORT_LABELS[category][uiLanguage],
      textX: tx,
      textY: ty,
      mid,
    };
  });

  const pickedLabel = picked
    ? categoryCopy(picked, uiLanguage).label
    : null;

  return (
    <motion.main
      key="wheel-game"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
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
              {copy.round} {round} · {copy.result(score.correct, score.total)}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <div className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 text-xs font-black text-[var(--ink)]">
            <Trophy className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            {score.correct}/{score.total}
          </div>
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
            onClick={newRound}
            aria-label={copy.newRound}
            className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105"
          >
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
            <span className="hidden sm:inline">{copy.newRound}</span>
          </button>
          <button
            type="button"
            onClick={onOpenSetup}
            className="rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-2 text-[11px] font-black uppercase text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            {copy.back}
          </button>
        </div>
      </header>

      <div className="mt-4 grid flex-1 items-center gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="flex flex-col items-center justify-center">
          <div className="relative aspect-square w-full max-w-[520px]">
            <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
              <div className="h-0 w-0 border-x-[14px] border-t-[26px] border-x-transparent border-t-[var(--accent)] drop-shadow" />
            </div>
            <motion.div
              className="h-full w-full"
              animate={{ rotate: rotation }}
              transition={
                spinning
                  ? { duration: 3.1, ease: [0.12, 0.72, 0.12, 1] }
                  : { duration: 0 }
              }
            >
              <svg
                viewBox="0 0 100 100"
                role="img"
                aria-label={copy.badge}
                className="h-full w-full drop-shadow-xl"
              >
                <circle cx="50" cy="50" r="47.5" fill="var(--line)" />
                {segments.length === 1 ? (
                  <circle cx="50" cy="50" r="46" fill={segments[0].color} />
                ) : (
                  segments.map((segment) => (
                    <path
                      key={segment.category}
                      d={segment.path}
                      fill={segment.color}
                      stroke="rgba(255,255,255,0.8)"
                      strokeWidth="0.45"
                    />
                  ))
                )}
                {segments.map((segment) => (
                  <text
                    key={`${segment.category}-label`}
                    x={segment.textX}
                    y={segment.textY}
                    fill="#ffffff"
                    fontSize={wheelCategories.length > 8 ? 2.7 : 3.3}
                    fontWeight="900"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${segment.mid} ${segment.textX} ${segment.textY})`}
                    style={{ paintOrder: 'stroke', stroke: 'rgba(0,0,0,0.25)', strokeWidth: 0.25 }}
                  >
                    {segment.label}
                  </text>
                ))}
                <circle cx="50" cy="50" r="10" fill="var(--surface)" stroke="var(--line)" strokeWidth="1.4" />
                <circle cx="50" cy="50" r="6.5" fill="var(--cta-bg)" />
              </svg>
            </motion.div>
          </div>
        </section>

        <section className="rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
            {spinning ? copy.spinning : copy.round}
          </p>
          <h2 className="mt-2 text-2xl font-black leading-tight text-[var(--ink)] sm:text-3xl">
            {pickedLabel ?? (spinning ? copy.spinning : copy.help)}
          </h2>
          <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
            {copy.result(score.correct, score.total)}
          </p>

          <motion.button
            type="button"
            onClick={spin}
            disabled={spinning || wheelCategories.length === 0}
            whileHover={spinning ? undefined : { scale: 1.02 }}
            whileTap={spinning ? undefined : { scale: 0.97 }}
            className="mt-5 flex min-h-[56px] w-full items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-6 text-base font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--panel-shadow)] transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
            {spinning ? copy.spinning : copy.spin}
          </motion.button>

          {question === null && !spinning && picked ? (
            <p className="mt-3 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-xs font-bold text-[var(--muted)]">
              {copy.empty}
            </p>
          ) : null}
        </section>
      </div>

      {isModalOpen && question ? (
        <QuestionModal
          question={question}
          diceNumber={round}
          numberLabel={uiLanguage === 'pt' ? 'Giro' : 'Spin'}
          phaseLabel={pickedLabel ?? undefined}
          mode={mode}
          difficulty={difficulty}
          language={language}
          status={status}
          continueLabel={copy.next}
          onAnswer={handleAnswer}
          onClose={closeQuestion}
        />
      ) : null}
    </motion.main>
  );
}
