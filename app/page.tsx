'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Candy,
  Check,
  ChevronRight,
  Dices,
  Flame,
  Ghost,
  GraduationCap,
  Moon,
  RotateCcw,
  Skull,
  Smartphone,
  Sparkles,
  Trophy,
  Wifi,
} from 'lucide-react';
import CompetitionGame from '@/components/CompetitionGame';
import CompetitionSetup from '@/components/CompetitionSetup';
import HalloweenBackdrop from '@/components/HalloweenBackdrop';
import QuestionModal from '@/components/QuestionModal';
import VolumeControl from '@/components/VolumeControl';
import { buildCompetitionPhases, COMPETITION_LEVELS, getCompetitionLevelMeta } from '@/lib/competition';
import {
  DICE_NUMBERS,
  DIFFICULTIES,
  MODES,
  getDeck,
  getDifficultyMeta,
  shuffle,
} from '@/lib/game';
import type {
  AnswerStatus,
  CompetitionConfig,
  CompetitionLevelId,
  DifficultyId,
  ModeId,
  ProgressiveRounds,
  Question,
  Student,
} from '@/lib/types';
import { cn } from '@/lib/utils';
import { readStorage, writeStorage } from '@/lib/storage';

// "Danse Macabre - Busy Strings" by Kevin MacLeod (incompetech.com), CC BY 3.0.
const HALLOWEEN_BGM_URL =
  'https://upload.wikimedia.org/wikipedia/commons/3/32/Danse_Macabre_-_Busy_Strings_%28ISRC_USUAN1100556%29.mp3';
const CLASSIC_BGM_URL = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3';
const VOLUME_STORAGE_KEY = 'volume';
const COMPETITION_STORAGE_KEY = 'competition-setup';
const DEFAULT_VOLUME = 0.7;
const ROUND_LENGTH = 20;
const HALLOWEEN_CONFETTI = ['#ff7a18', '#a855f7', '#7dfabf', '#ffd166', '#ff4d6d'];
const CLASSIC_CONFETTI = ['#26ccff', '#a25afd', '#ff5e7e', '#88ff5a', '#fcff42', '#ffa62d'];

const DEFAULT_COMPETITION_CONFIG: CompetitionConfig = {
  level: 'easy',
  progressiveRounds: 2,
  order: 'sequential',
};

const COMPETITION_LEVEL_IDS = new Set<CompetitionLevelId>([
  'easy',
  'medium',
  'hard',
  'progressive',
]);

const DIFFICULTY_ICONS = {
  easy: Candy,
  medium: Ghost,
  hard: Skull,
} as const;

const COMPETITION_ICONS = {
  easy: Candy,
  medium: Ghost,
  hard: Skull,
  progressive: Flame,
} as const;

const MODE_ICONS = {
  halloween: Ghost,
  classic: GraduationCap,
} as const;

type PlayStyle = 'd20' | 'competition';
type Screen = 'menu' | 'playing' | 'competition-setup' | 'competition';

function readCompetitionConfig(): CompetitionConfig | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = readStorage(COMPETITION_STORAGE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as { config?: unknown };
    const configValue =
      parsed.config && typeof parsed.config === 'object'
        ? (parsed.config as Partial<CompetitionConfig>)
        : {};
    const level =
      configValue.level && COMPETITION_LEVEL_IDS.has(configValue.level)
        ? configValue.level
        : DEFAULT_COMPETITION_CONFIG.level;
    const progressiveRounds: ProgressiveRounds =
      configValue.progressiveRounds === 3 ? 3 : 2;
    const order = configValue.order === 'random' ? 'random' : 'sequential';

    return { level, progressiveRounds, order };
  } catch {
    return null;
  }
}

export default function GamePage() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [mode, setMode] = useState<ModeId>('halloween');
  const [difficulty, setDifficulty] = useState<DifficultyId>('medium');
  const [playStyle, setPlayStyle] = useState<PlayStyle>('d20');
  // Only the competition settings persist; every new session starts with an empty roster.
  const [competitionConfig, setCompetitionConfig] = useState<CompetitionConfig>(
    () => readCompetitionConfig() ?? DEFAULT_COMPETITION_CONFIG
  );
  const [competitionStudents, setCompetitionStudents] = useState<Student[]>([]);
  const [competitionRun, setCompetitionRun] = useState(0);

  const [queue, setQueue] = useState<Question[]>(() => shuffle(getDeck('halloween', 'medium')));
  const [roundCount, setRoundCount] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [currentNumber, setCurrentNumber] = useState<number | null>(null);
  const [answerStatus, setAnswerStatus] = useState<AnswerStatus>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(() => {
    if (typeof window === 'undefined') return DEFAULT_VOLUME;

    try {
      const stored = readStorage(VOLUME_STORAGE_KEY);
      if (stored === null) return DEFAULT_VOLUME;

      const parsed = Number(stored);
      return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : DEFAULT_VOLUME;
    } catch {
      return DEFAULT_VOLUME;
    }
  });

  const audioCtxRef = useRef<AudioContext | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  // Synchronous guard: AnimatePresence freezes the exiting modal's props, so state
  // alone cannot prevent an answer during the close animation.
  const acceptingAnswersRef = useRef(false);

  const isHalloween = mode === 'halloween';
  const effectivePlayStyle: PlayStyle = isHalloween ? playStyle : 'd20';
  const difficultyMeta = getDifficultyMeta(difficulty);
  const deckSize = useMemo(() => getDeck(mode, difficulty).length, [mode, difficulty]);
  const roundComplete = roundCount >= ROUND_LENGTH;
  const competitionLevelMeta = getCompetitionLevelMeta(competitionConfig.level);
  const competitionPhases = useMemo(
    () =>
      buildCompetitionPhases(
        competitionConfig.level,
        competitionConfig.progressiveRounds
      ),
    [competitionConfig.level, competitionConfig.progressiveRounds]
  );
  const competitionFirstPhase = competitionPhases[0];
  const competitionLastPhase = competitionPhases[competitionPhases.length - 1];

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null;

    if (!audioCtxRef.current) {
      const AudioContextClass =
        window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

      if (!AudioContextClass) return null;
      audioCtxRef.current = new AudioContextClass();
    }

    if (audioCtxRef.current.state === 'suspended') {
      void audioCtxRef.current.resume();
    }

    return audioCtxRef.current;
  }, []);

  const playTone = useCallback(
    (frequency: number, type: OscillatorType, duration: number, level = 0.08) => {
      if (isMuted || volume <= 0) return;

      const context = ensureAudioContext();
      if (!context) return;

      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const now = context.currentTime;

      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.0001, level * volume), now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.03);
    },
    [ensureAudioContext, isMuted, volume]
  );

  const startBgm = useCallback(() => {
    const track = isHalloween ? HALLOWEEN_BGM_URL : CLASSIC_BGM_URL;

    if (bgmRef.current && bgmRef.current.dataset.track !== track) {
      bgmRef.current.pause();
      bgmRef.current = null;
    }

    if (!bgmRef.current) {
      const audio = new Audio(track);
      audio.loop = true;
      audio.preload = 'none';
      audio.dataset.track = track;
      bgmRef.current = audio;
    }

    bgmRef.current.volume = Math.min(1, volume * 0.35);
    bgmRef.current.muted = isMuted || volume <= 0;
    bgmRef.current.play().catch(() => {
      // Browsers can block autoplay; the game still works without music.
    });
  }, [isHalloween, isMuted, volume]);

  useEffect(() => {
    const audio = bgmRef.current;
    if (!audio) return;

    audio.volume = Math.min(1, volume * 0.35);
    audio.muted = isMuted || volume <= 0;
  }, [isMuted, volume]);

  useEffect(() => {
    writeStorage(VOLUME_STORAGE_KEY, String(volume));
  }, [volume]);

  useEffect(() => {
    writeStorage(
      COMPETITION_STORAGE_KEY,
      JSON.stringify({ config: competitionConfig })
    );
  }, [competitionConfig]);

  useEffect(() => {
    return () => {
      bgmRef.current?.pause();
      bgmRef.current = null;
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  const startGame = useCallback(() => {
    setQueue(shuffle(getDeck(mode, difficulty)));
    setRoundCount(0);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setBestStreak(0);
    setCurrentQuestion(null);
    setCurrentNumber(null);
    setAnswerStatus(null);
    acceptingAnswersRef.current = false;
    setIsModalOpen(false);
    setScreen('playing');

    void ensureAudioContext();
    startBgm();
  }, [difficulty, ensureAudioContext, mode, startBgm]);

  const startNewRound = useCallback(() => {
    setQueue(shuffle(getDeck(mode, difficulty)));
    setRoundCount(0);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
    setBestStreak(0);
    setCurrentQuestion(null);
    setCurrentNumber(null);
    setAnswerStatus(null);
    acceptingAnswersRef.current = false;
    setIsModalOpen(false);
    playTone(isHalloween ? 330 : 440, 'triangle', 0.1, 0.05);
  }, [difficulty, isHalloween, mode, playTone]);

  const backToMenu = useCallback(() => {
    acceptingAnswersRef.current = false;
    setIsModalOpen(false);
    setScreen('menu');
    setCurrentQuestion(null);
    setCurrentNumber(null);
    setAnswerStatus(null);
    bgmRef.current?.pause();
  }, []);

  const openCompetitionSetup = useCallback(() => {
    setPlayStyle('competition');
    bgmRef.current?.pause();
    setScreen('competition-setup');
    playTone(392, 'triangle', 0.09, 0.055);
  }, [playTone]);

  const startCompetition = useCallback(() => {
    if (competitionStudents.length < 2) return;

    setCompetitionRun((run) => run + 1);
    setScreen('competition');
    void ensureAudioContext();
    startBgm();
    playTone(392, 'triangle', 0.1, 0.06);
  }, [competitionStudents.length, ensureAudioContext, playTone, startBgm]);

  const playAgain = useCallback(() => {
    setCompetitionRun((run) => run + 1);
    void ensureAudioContext();
    startBgm();
  }, [ensureAudioContext, startBgm]);

  const backToSetup = useCallback(() => {
    bgmRef.current?.pause();
    setScreen('competition-setup');
  }, []);

  const drawQuestion = useCallback((): Question => {
    if (queue.length === 0) {
      const reshuffled = shuffle(getDeck(mode, difficulty));
      setQueue(reshuffled.slice(1));
      return reshuffled[0];
    }

    const [next, ...rest] = queue;
    setQueue(rest);
    return next;
  }, [difficulty, mode, queue]);

  const handleNumberClick = useCallback(
    (number: number) => {
      if (isModalOpen) return;

      const question = drawQuestion();
      setCurrentQuestion(question);
      setCurrentNumber(number);
      setAnswerStatus(null);
      acceptingAnswersRef.current = true;
      setIsModalOpen(true);
      playTone(isHalloween ? 392 : 440, 'triangle', 0.09, 0.055);
    },
    [drawQuestion, isHalloween, isModalOpen, playTone]
  );

  const triggerConfetti = useCallback(() => {
    const colors = isHalloween ? HALLOWEEN_CONFETTI : CLASSIC_CONFETTI;
    const common = { colors, disableForReducedMotion: true };

    confetti({ ...common, particleCount: 80, spread: 75, origin: { y: 0.62 } });
    confetti({ ...common, particleCount: 45, angle: 55, spread: 55, origin: { x: 0, y: 0.7 } });
    confetti({ ...common, particleCount: 45, angle: 125, spread: 55, origin: { x: 1, y: 0.7 } });
  }, [isHalloween]);

  const handleAnswer = useCallback(
    (guess: boolean) => {
      if (!acceptingAnswersRef.current || !isModalOpen || !currentQuestion || answerStatus) {
        return;
      }

      acceptingAnswersRef.current = false;
      const correct = guess === currentQuestion.answer;
      setAnswerStatus(correct ? 'correct' : 'incorrect');
      setRoundCount((previous) => Math.min(previous + 1, ROUND_LENGTH));
      setScore((previous) => ({
        correct: previous.correct + (correct ? 1 : 0),
        total: previous.total + 1,
      }));

      if (correct) {
        const nextStreak = streak + 1;
        setStreak(nextStreak);
        setBestStreak((previous) => Math.max(previous, nextStreak));
        playTone(660, 'triangle', 0.16, 0.08);
        window.setTimeout(() => playTone(990, 'triangle', 0.2, 0.07), 90);
        triggerConfetti();
      } else {
        setStreak(0);
        playTone(150, 'sawtooth', 0.3, 0.07);
      }
    },
    [answerStatus, currentQuestion, isModalOpen, playTone, streak, triggerConfetti]
  );

  const closeQuestion = useCallback(() => {
    acceptingAnswersRef.current = false;
    setIsModalOpen(false);
    playTone(300, 'sine', 0.06, 0.03);
  }, [playTone]);

  const toggleMute = () => {
    if (isMuted && volume === 0) setVolume(DEFAULT_VOLUME);
    setIsMuted((muted) => !muted);
  };

  const handleVolumeChange = (value: number) => {
    const next = Math.min(1, Math.max(0, value));
    setVolume(next);
    if (next > 0) setIsMuted(false);
  };

  const ModeIcon = MODE_ICONS[mode];
  const selectedDifficulty = getDifficultyMeta(difficulty);

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          'game-shell relative flex min-h-dvh w-full flex-col font-sans',
          isHalloween ? 'theme-halloween' : 'theme-classic',
          screen === 'playing' ? 'h-dvh overflow-hidden' : 'overflow-x-hidden'
        )}
      >
        {isHalloween && <HalloweenBackdrop dimmed={screen !== 'menu'} />}

        <AnimatePresence mode="wait">
          {screen === 'menu' && (
            <motion.main
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)] shadow-[var(--tile-shadow)]">
                  Supp
                </span>
                <span className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted)]">
                  {isHalloween ? (
                    <Moon className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                  )}
                  {isHalloween ? 'Spooky season special' : 'Year-round fun'}
                </span>
              </div>

              <AnimatePresence mode="wait">
                <motion.header
                  key={`${mode}-${effectivePlayStyle}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.22 }}
                  className="mt-6 sm:mt-8"
                >
                  <h1
                    className={cn(
                      'text-balance text-4xl font-black uppercase leading-[0.95] tracking-tight text-[var(--ink)] sm:text-6xl',
                      isHalloween && 'hw-title'
                    )}
                  >
                    {isHalloween ? (
                      effectivePlayStyle === 'competition' ? (
                        <>
                          Halloween
                          <br />
                          Competition
                        </>
                      ) : (
                        <>
                          Halloween
                          <br />
                          Trivia
                        </>
                      )
                    ) : (
                      <>
                        Can you
                        <br />
                        guess?
                      </>
                    )}
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm font-semibold text-[var(--muted)] sm:text-base">
                    {isHalloween
                      ? effectivePlayStyle === 'competition'
                        ? 'Register your students and run a Halloween knockout. Each phase asks one question per student: correct answers advance, wrong answers are out.'
                        : 'Trick or treat! Pick a difficulty, roll a real D20 and answer the spooky true-or-false questions.'
                      : 'The original classroom icebreaker. Pick a mode and let the D20 decide the next question.'}
                  </p>
                </motion.header>
              </AnimatePresence>

              <section aria-label="Game mode" className="mt-6 grid gap-3 sm:grid-cols-2">
                {MODES.map((item) => {
                  const Icon = MODE_ICONS[item.id];
                  const selected = mode === item.id;

                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      aria-pressed={selected}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => {
                        setMode(item.id);
                        if (item.id === 'classic') setPlayStyle('d20');
                      }}
                      className={cn(
                        'relative overflow-hidden rounded-2xl border-4 p-4 text-left transition-colors sm:p-5',
                        selected
                          ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-[var(--panel-shadow)]'
                          : 'border-[var(--line-soft)] bg-[var(--surface)] hover:border-[var(--line)]'
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span
                          className={cn(
                            'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2',
                            selected
                              ? 'border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]'
                              : 'border-[var(--line-soft)] text-[var(--muted)]'
                          )}
                        >
                          <Icon className="h-5 w-5" aria-hidden="true" />
                        </span>
                        <span
                          className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full border-2 transition',
                            selected
                              ? 'border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]'
                              : 'border-[var(--line-soft)] text-transparent'
                          )}
                        >
                          <Check className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                      </div>
                      <h2 className="mt-3 text-lg font-black text-[var(--ink)] sm:text-xl">{item.label}</h2>
                      <p className="mt-1 text-xs font-medium leading-relaxed text-[var(--muted)] sm:text-sm">
                        {item.description}
                      </p>
                    </motion.button>
                  );
                })}
              </section>

              <AnimatePresence initial={false}>
                {isHalloween && (
                  <motion.section
                    key="play-style"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    aria-label="Play style"
                    className="mt-6"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                        Choose how to play
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                        Halloween only
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3">
                      {[
                        {
                          id: 'd20' as PlayStyle,
                          label: 'D20 Roll',
                          tagline: 'One question at a time',
                          description: 'Roll a real D20 and tap the number you rolled.',
                          Icon: Dices,
                        },
                        {
                          id: 'competition' as PlayStyle,
                          label: 'Competition',
                          tagline: 'Knockout tournament',
                          description: 'Register students and run the phase ladder.',
                          Icon: Trophy,
                        },
                      ].map((item) => {
                        const selected = effectivePlayStyle === item.id;

                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            aria-pressed={selected}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setPlayStyle(item.id)}
                            className={cn(
                              'rounded-2xl border-2 p-3 text-left transition-colors sm:p-4',
                              selected
                                ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-[var(--panel-shadow)]'
                                : 'border-[var(--line-soft)] bg-[var(--surface)] hover:border-[var(--line)]'
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span
                                className={cn(
                                  'flex h-9 w-9 items-center justify-center rounded-xl border-2',
                                  selected
                                    ? 'border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]'
                                    : 'border-[var(--line-soft)] text-[var(--muted)]'
                                )}
                              >
                                <item.Icon className="h-4 w-4" aria-hidden="true" />
                              </span>
                              <span
                                className={cn(
                                  'flex h-5 w-5 items-center justify-center rounded-full border-2 transition',
                                  selected
                                    ? 'border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]'
                                    : 'border-[var(--line-soft)] text-transparent'
                                )}
                              >
                                <Check className="h-3 w-3" aria-hidden="true" />
                              </span>
                            </div>
                            <p className="mt-2 text-base font-black text-[var(--ink)]">{item.label}</p>
                            <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--accent)]">
                              {item.tagline}
                            </p>
                            <p className="mt-1 hidden text-xs leading-snug text-[var(--muted)] sm:block">
                              {item.description}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              <AnimatePresence initial={false}>
                {isHalloween && (
                  <motion.a
                    key="live-room"
                    href="/host"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-4 border-dashed border-[var(--accent)] bg-[var(--surface)] p-4 sm:p-5"
                  >
                    <span className="flex items-start gap-3">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]">
                        <Wifi className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span>
                        <span className="block text-lg font-black text-[var(--ink)]">Halloween Live</span>
                        <span className="mt-0.5 block text-xs font-medium leading-relaxed text-[var(--muted)]">
                          Live room: students join with a code or QR and answer on their own phones.
                        </span>
                      </span>
                    </span>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
                  </motion.a>
                )}
              </AnimatePresence>

              {/* Students: direct shortcut to type the room code on a phone. */}
              <motion.a
                key="join-room"
                href="/join"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2 }}
                className="mt-4 flex items-center justify-between gap-3 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 transition-colors hover:border-[var(--accent)] sm:p-5"
              >
                <span className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]">
                    <Smartphone className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-lg font-black text-[var(--ink)]">Join a live room</span>
                    <span className="mt-0.5 block text-xs font-medium leading-relaxed text-[var(--muted)]">
                      Student? Open the join page, type the room code shown on the projector and answer on your phone.
                    </span>
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              </motion.a>

              <AnimatePresence initial={false} mode="wait">
                {isHalloween && effectivePlayStyle === 'd20' && (
                  <motion.section
                    key="difficulty"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    aria-label="Difficulty"
                    className="mt-6"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                        Choose your difficulty
                      </h2>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3 sm:gap-3">
                      {DIFFICULTIES.map((item) => {
                        const Icon = DIFFICULTY_ICONS[item.id];
                        const selected = difficulty === item.id;

                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            aria-pressed={selected}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() => setDifficulty(item.id)}
                            className={cn(
                              'rounded-2xl border-2 p-3 text-left transition-colors',
                              selected
                                ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-[var(--panel-shadow)]'
                                : 'border-[var(--line-soft)] bg-[var(--surface)] hover:border-[var(--line)]'
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
                              <span className="text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">
                                {item.audience}
                              </span>
                            </div>
                            <p className="mt-2 text-base font-black text-[var(--ink)]">{item.label}</p>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
                              {item.tagline}
                            </p>
                            <p className="mt-1 hidden text-xs leading-snug text-[var(--muted)] sm:block">
                              {item.description}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.section>
                )}

                {isHalloween && effectivePlayStyle === 'competition' && (
                  <motion.section
                    key="competition-level"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2 }}
                    aria-label="Competition level"
                    className="mt-6"
                  >
                    <div className="mb-2 flex items-center justify-between gap-3">
                      <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                        Competition level
                      </h2>
                      <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                        {competitionLevelMeta.phasesLabel}
                      </span>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2 sm:gap-3 lg:grid-cols-4">
                      {COMPETITION_LEVELS.map((item) => {
                        const Icon = COMPETITION_ICONS[item.id];
                        const selected = competitionConfig.level === item.id;

                        return (
                          <motion.button
                            key={item.id}
                            type="button"
                            aria-pressed={selected}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.99 }}
                            onClick={() =>
                              setCompetitionConfig((previous) => ({
                                ...previous,
                                level: item.id,
                              }))
                            }
                            className={cn(
                              'rounded-2xl border-2 p-3 text-left transition-colors',
                              selected
                                ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-[var(--panel-shadow)]'
                                : 'border-[var(--line-soft)] bg-[var(--surface)] hover:border-[var(--line)]'
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
                              <span className="text-[9px] font-black uppercase tracking-wider text-[var(--muted)]">
                                {item.phasesLabel}
                              </span>
                            </div>
                            <p className="mt-2 text-base font-black text-[var(--ink)]">{item.label}</p>
                            <p className="text-[11px] font-bold uppercase tracking-wide text-[var(--accent)]">
                              {item.tagline}
                            </p>
                            <p className="mt-1 hidden text-xs leading-snug text-[var(--muted)] sm:block">
                              {item.description}
                            </p>
                          </motion.button>
                        );
                      })}
                    </div>

                    {competitionConfig.level === 'progressive' && (
                      <div className="mt-3 flex flex-col gap-2 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface)] p-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                            Rounds per difficulty
                          </p>
                          <p className="mt-1 text-xs font-semibold leading-relaxed text-[var(--muted)]">
                            Two or three rounds in Easy, Medium and Hard.
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 sm:w-56">
                          {([2, 3] as ProgressiveRounds[]).map((rounds) => {
                            const selected = competitionConfig.progressiveRounds === rounds;

                            return (
                              <button
                                key={rounds}
                                type="button"
                                aria-pressed={selected}
                                onClick={() =>
                                  setCompetitionConfig((previous) => ({
                                    ...previous,
                                    progressiveRounds: rounds,
                                  }))
                                }
                                className={cn(
                                  'rounded-xl border-2 px-3 py-2 text-xs font-black uppercase tracking-wide transition',
                                  selected
                                    ? 'border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]'
                                    : 'border-[var(--line-soft)] text-[var(--muted)] hover:border-[var(--line)]'
                                )}
                              >
                                {rounds} rounds
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)]">
                      <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-1 text-[var(--accent)]">
                        {competitionFirstPhase?.shortLabel}
                      </span>
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                      <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-1 text-[var(--accent)]">
                        {competitionLastPhase?.shortLabel}
                      </span>
                    </div>
                  </motion.section>
                )}
              </AnimatePresence>

              <div className="mt-7 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                {effectivePlayStyle === 'competition' ? (
                  <>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={openCompetitionSetup}
                      className="flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-7 text-lg font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--panel-shadow)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] sm:w-auto sm:text-xl"
                    >
                      <Trophy className="h-5 w-5" aria-hidden="true" />
                      Set up competition
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </motion.button>

                    <div className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
                      <p>Register your students and choose the level on the next screen.</p>
                      <p>
                        {competitionPhases.length} phases ·{' '}
                        {competitionConfig.order === 'random' ? 'Random order' : 'In order'}.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={startGame}
                      className="flex min-h-[64px] w-full items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-7 text-lg font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--panel-shadow)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] sm:w-auto sm:text-xl"
                    >
                      <Sparkles className="h-5 w-5" aria-hidden="true" />
                      {isHalloween ? 'Start the spooky round' : 'Start game'}
                      <ChevronRight className="h-5 w-5" aria-hidden="true" />
                    </motion.button>

                    <div className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
                      <p>Roll a real D20, then tap the number you rolled.</p>
                      <p>
                        {isHalloween
                          ? `${selectedDifficulty.label} deck: ${selectedDifficulty.tagline} · ${deckSize} questions.`
                          : 'Mixed topics: games, tech, anime and more.'}
                      </p>
                    </div>
                  </>
                )}
              </div>

              <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]">
                Tip: press T or F to answer · Esc closes the question
              </p>

            </motion.main>
          )}

          {screen === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              inert={isModalOpen}
              className="relative z-10 flex h-dvh w-full flex-col"
            >
              <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b-4 border-[var(--line)] bg-[var(--surface)] px-3 py-2 sm:gap-3 sm:px-6 sm:py-3">
                <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={backToMenu}
                    aria-label="Back to menu"
                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">Menu</span>
                  </button>

                  <div className="min-w-0">
                    <h1 className="flex items-center gap-1.5 truncate text-base font-black uppercase tracking-tight text-[var(--ink)] sm:text-2xl">
                      {isHalloween ? (
                        <Ghost className="h-4 w-4 shrink-0 text-[var(--accent)] sm:h-5 sm:w-5" aria-hidden="true" />
                      ) : (
                        <GraduationCap className="h-4 w-4 shrink-0 text-[var(--accent)] sm:h-5 sm:w-5" aria-hidden="true" />
                      )}
                      {isHalloween ? 'Halloween Trivia' : 'Teacher Trivia'}
                    </h1>
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] sm:text-xs">
                      {isHalloween
                        ? `${difficultyMeta.label} · ${difficultyMeta.tagline}`
                        : 'Classroom classic · mixed topics'}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <div
                    className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 text-xs font-black text-[var(--ink)]"
                    aria-label={`Score: ${score.correct} correct out of ${score.total}`}
                  >
                    <Trophy className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                    <span>
                      {score.correct}/{score.total}
                    </span>
                  </div>

                  {streak >= 2 && (
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="flex h-10 items-center gap-1 rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-2.5 text-xs font-black text-[var(--accent)]"
                      aria-label={`Streak: ${streak}`}
                    >
                      <Flame className="h-4 w-4" aria-hidden="true" />
                      {streak}
                    </motion.div>
                  )}

                  <VolumeControl
                    volume={volume}
                    muted={isMuted}
                    onVolumeChange={handleVolumeChange}
                    onToggleMute={toggleMute}
                  />

                  <button
                    type="button"
                    onClick={startNewRound}
                    aria-label="Start a new round"
                    className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">New round</span>
                  </button>
                </div>
              </header>

              <main className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-4">
                <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] sm:gap-3 sm:text-xs">
                  <span className="whitespace-nowrap">Round progress</span>
                  <div
                    role="progressbar"
                    aria-label="Round progress"
                    aria-valuemin={0}
                    aria-valuemax={ROUND_LENGTH}
                    aria-valuenow={roundCount}
                    className="h-2 flex-1 overflow-hidden rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)]"
                  >
                    <motion.div
                      className="h-full rounded-full bg-[var(--accent)]"
                      animate={{ width: `${(roundCount / ROUND_LENGTH) * 100}%` }}
                      transition={{ type: 'spring', stiffness: 180, damping: 26 }}
                    />
                  </div>
                  <span className="whitespace-nowrap">
                    {Math.min(roundCount, ROUND_LENGTH)}/{ROUND_LENGTH}
                  </span>
                  {bestStreak >= 2 && (
                    <span className="hidden whitespace-nowrap text-[var(--accent)] sm:inline">
                      Best streak {bestStreak}
                    </span>
                  )}
                </div>

                {roundComplete && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex shrink-0 flex-wrap items-center justify-between gap-2 rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-xs font-bold text-[var(--ink)]"
                  >
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                      20 questions done! Ready for another round?
                    </span>
                    <button
                      type="button"
                      onClick={startNewRound}
                      className="rounded-lg border-2 border-[var(--line)] bg-[var(--cta-bg)] px-3 py-1 text-[11px] font-black uppercase text-[var(--cta-text)]"
                    >
                      New round
                    </button>
                  </motion.div>
                )}

                <div className="grid min-h-0 flex-1 grid-cols-4 grid-rows-5 gap-2 sm:grid-cols-5 sm:grid-rows-4 sm:gap-3">
                  {DICE_NUMBERS.map((number) => (
                    <motion.button
                      key={number}
                      type="button"
                      onClick={() => handleNumberClick(number)}
                      disabled={isModalOpen}
                      aria-label={`Open a question for roll ${number}`}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.96 }}
                      className="relative flex min-h-0 items-center justify-center rounded-2xl border-[3px] border-[var(--line)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--tile-shadow)] transition-colors hover:bg-[var(--surface-2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] disabled:pointer-events-none sm:border-4"
                    >
                      <span className="text-2xl font-black sm:text-4xl">{number}</span>
                      {isHalloween && (
                        <span
                          className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full bg-[var(--accent)] opacity-60 sm:bottom-2"
                          aria-hidden="true"
                        />
                      )}
                    </motion.button>
                  ))}
                </div>
              </main>
            </motion.div>
          )}

          {screen === 'competition-setup' && (
            <CompetitionSetup
              key="competition-setup"
              students={competitionStudents}
              config={competitionConfig}
              onStudentsChange={setCompetitionStudents}
              onConfigChange={setCompetitionConfig}
              onStart={startCompetition}
              onBack={backToMenu}
            />
          )}

          {screen === 'competition' && (
            <CompetitionGame
              key={`competition-${competitionRun}`}
              students={competitionStudents}
              config={competitionConfig}
              volume={volume}
              muted={isMuted}
              onVolumeChange={handleVolumeChange}
              onToggleMute={toggleMute}
              playTone={playTone}
              triggerConfetti={triggerConfetti}
              onExit={backToMenu}
              onPlayAgain={playAgain}
              onOpenSetup={backToSetup}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isModalOpen && currentQuestion && currentNumber !== null && (
            <QuestionModal
              question={currentQuestion}
              diceNumber={currentNumber}
              mode={mode}
              difficulty={difficulty}
              status={answerStatus}
              onAnswer={handleAnswer}
              onClose={closeQuestion}
            />
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
