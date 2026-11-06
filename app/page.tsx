'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, MotionConfig, motion } from 'motion/react';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  CalendarHeart,
  Candy,
  Check,
  ChevronRight,
  Clapperboard,
  Cpu,
  Dices,
  Egg,
  Flame,
  Gamepad2,
  Ghost,
  GraduationCap,
  PawPrint,
  RotateCcw,
  Skull,
  Smartphone,
  Snowflake,
  Sparkles,
  Trophy,
  Tv,
  Wifi,
} from 'lucide-react';
import CompetitionGame from '@/components/CompetitionGame';
import CompetitionSetup from '@/components/CompetitionSetup';
import D20Setup from '@/components/D20Setup';
import HalloweenBackdrop from '@/components/HalloweenBackdrop';
import LanguageToggle from '@/components/LanguageToggle';
import QuestionModal from '@/components/QuestionModal';
import ThemeToggle from '@/components/ThemeToggle';
import VolumeControl from '@/components/VolumeControl';
import { buildCompetitionPhases } from '@/lib/competition';
import {
  DICE_NUMBERS,
  DIFFICULTIES,
  getDeck,
  shuffle,
} from '@/lib/game';
import {
  CLASSIC_ALL_CATEGORIES,
  CLASSIC_CATEGORIES,
  getClassicDeck,
} from '@/lib/classic-questions';
import type {
  AnswerStatus,
  ClassicCategoryId,
  CompetitionConfig,
  CompetitionLevelId,
  DifficultyId,
  ModeId,
  ProgressiveRounds,
  Question,
  Student,
  Theme,
} from '@/lib/types';
import type { Language } from '@/lib/i18n';
import { MENU_COPY } from '@/lib/i18n/menu-copy';
import {
  categoryCopy,
  competitionLevelCopy,
  competitionLevels,
  difficultyCopy,
  localizePhase,
} from '@/lib/i18n/game-copy';
import { cn } from '@/lib/utils';
import { readStorage, writeStorage } from '@/lib/storage';

// "Danse Macabre - Busy Strings" by Kevin MacLeod (incompetech.com), CC BY 3.0.
const HALLOWEEN_BGM_URL =
  'https://upload.wikimedia.org/wikipedia/commons/3/32/Danse_Macabre_-_Busy_Strings_%28ISRC_USUAN1100556%29.mp3';

/**
 * Royalty-free SoundHelix examples used as the default-mode soundtrack.
 * They play in a shuffled cycle: no track repeats until the whole list has
 * played, and the first track of a new cycle never repeats the last one.
 */
const CLASSIC_BGM_URLS = Array.from(
  { length: 10 },
  (_, index) => `https://www.soundhelix.com/examples/mp3/SoundHelix-Song-${index + 2}.mp3`
);
const VOLUME_STORAGE_KEY = 'volume';
const COMPETITION_STORAGE_KEY = 'competition-setup';
const LANGUAGE_STORAGE_KEY = 'language';
const UI_LANGUAGE_STORAGE_KEY = 'ui-language';
const THEME_STORAGE_KEY = 'theme';
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

const CATEGORY_ICONS = {
  games: Gamepad2,
  anime: Tv,
  'pop-culture': Clapperboard,
  animals: PawPrint,
  tech: Cpu,
} as const;

type PlayStyle = 'd20' | 'competition' | 'live';
type Screen =
  | 'menu'
  | 'events'
  | 'd20-setup'
  | 'playing'
  | 'competition-setup'
  | 'competition';

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
  const [mode, setMode] = useState<ModeId>('classic');
  const [difficulty, setDifficulty] = useState<DifficultyId>('medium');
  const [classicCategories, setClassicCategories] = useState<ClassicCategoryId[]>(
    CLASSIC_ALL_CATEGORIES
  );
  const [language, setLanguage] = useState<Language>(() =>
    readStorage(LANGUAGE_STORAGE_KEY) === 'en' ? 'en' : 'pt'
  );
  const [uiLanguage, setUiLanguage] = useState<Language>(() => {
    const stored =
      readStorage(UI_LANGUAGE_STORAGE_KEY) ?? readStorage(LANGUAGE_STORAGE_KEY);
    return stored === 'en' ? 'en' : 'pt';
  });
  const [theme, setTheme] = useState<Theme>(() =>
    readStorage(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  );
  const [playStyle, setPlayStyle] = useState<PlayStyle | null>(null);
  // Only the competition settings persist; every new session starts with an empty roster.
  const [competitionConfig, setCompetitionConfig] = useState<CompetitionConfig>(
    () => readCompetitionConfig() ?? DEFAULT_COMPETITION_CONFIG
  );
  const [competitionStudents, setCompetitionStudents] = useState<Student[]>([]);
  const [competitionRun, setCompetitionRun] = useState(0);

  const [queue, setQueue] = useState<Question[]>(() =>
    shuffle(getClassicDeck('medium', CLASSIC_ALL_CATEGORIES))
  );
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
  const classicQueueRef = useRef<string[]>([]);
  const lastClassicTrackRef = useRef<string | null>(null);
  const playClassicTrackRef = useRef<(() => void) | null>(null);
  // Synchronous guard: AnimatePresence freezes the exiting modal's props, so state
  // alone cannot prevent an answer during the close animation.
  const acceptingAnswersRef = useRef(false);

  const isHalloween = mode === 'halloween';
  const isClassic = mode === 'classic';
  const isLive = playStyle === 'live';
  const isCompetition = playStyle === 'competition';
  const c = MENU_COPY[uiLanguage];
  const titleLines = isHalloween
    ? isCompetition
      ? c.titles.halloweenCompetition
      : isLive
        ? c.titles.halloweenLive
        : c.titles.halloweenD20
    : isCompetition
      ? c.titles.competition
      : isLive
        ? c.titles.live
        : c.titles.d20;
  const subtitle = isHalloween
    ? isCompetition
      ? c.subtitles.halloweenCompetition
      : isLive
        ? c.subtitles.halloweenLive
        : c.subtitles.halloweenD20
    : isCompetition
      ? c.subtitles.competition
      : isLive
        ? c.subtitles.live
        : c.subtitles.d20;
  const difficultyMeta = difficultyCopy(difficulty, uiLanguage);
  const activeDeck = useMemo(
    () =>
      isClassic
        ? getClassicDeck(difficulty, classicCategories)
        : getDeck('halloween', difficulty),
    [classicCategories, difficulty, isClassic]
  );
  const deckSize = activeDeck.length;
  const canStartRound =
    playStyle !== null && (!isClassic || classicCategories.length > 0);
  const roundComplete = roundCount >= ROUND_LENGTH;
  const competitionLevelMeta = competitionLevelCopy(
    competitionConfig.level,
    uiLanguage
  );
  const competitionLevelOptions = competitionLevels(uiLanguage);
  const competitionPhases = useMemo(
    () =>
      buildCompetitionPhases(
        competitionConfig.level,
        competitionConfig.progressiveRounds
      ),
    [competitionConfig.level, competitionConfig.progressiveRounds]
  );
  const localizedCompetitionPhases = useMemo(
    () => competitionPhases.map((phase) => localizePhase(phase, uiLanguage)),
    [competitionPhases, uiLanguage]
  );
  const competitionFirstPhase = localizedCompetitionPhases[0];
  const competitionLastPhase =
    localizedCompetitionPhases[localizedCompetitionPhases.length - 1];

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

  const nextClassicTrack = useCallback(() => {
    if (classicQueueRef.current.length === 0) {
      const queue = shuffle(CLASSIC_BGM_URLS);
      // Avoid playing the same track twice in a row across shuffle cycles.
      if (
        lastClassicTrackRef.current &&
        queue.length > 1 &&
        queue[0] === lastClassicTrackRef.current
      ) {
        [queue[0], queue[1]] = [queue[1], queue[0]];
      }
      classicQueueRef.current = queue;
    }

    const track = classicQueueRef.current.shift() ?? CLASSIC_BGM_URLS[0];
    lastClassicTrackRef.current = track;
    return track;
  }, []);

  const playClassicTrack = useCallback(() => {
    const track = nextClassicTrack();
    const previous = bgmRef.current;
    if (previous) {
      previous.onended = null;
      previous.pause();
    }

    const audio = new Audio(track);
    audio.loop = false;
    audio.preload = 'none';
    audio.dataset.mode = 'classic';
    audio.dataset.track = track;
    audio.volume = Math.min(1, volume * 0.35);
    audio.muted = isMuted || volume <= 0;
    audio.onended = () => {
      playClassicTrackRef.current?.();
    };
    bgmRef.current = audio;
    audio.play().catch(() => {
      // Browsers can block autoplay; the game still works without music.
    });
  }, [isMuted, nextClassicTrack, volume]);
  playClassicTrackRef.current = playClassicTrack;

  const startBgm = useCallback(() => {
    if (isHalloween) {
      const track = HALLOWEEN_BGM_URL;

      if (bgmRef.current && bgmRef.current.dataset.mode !== 'halloween') {
        bgmRef.current.onended = null;
        bgmRef.current.pause();
        bgmRef.current = null;
      }

      if (!bgmRef.current) {
        const audio = new Audio(track);
        audio.loop = true;
        audio.preload = 'none';
        audio.dataset.mode = 'halloween';
        audio.dataset.track = track;
        bgmRef.current = audio;
      }

      bgmRef.current.volume = Math.min(1, volume * 0.35);
      bgmRef.current.muted = isMuted || volume <= 0;
      bgmRef.current.play().catch(() => {
        // Browsers can block autoplay; the game still works without music.
      });
      return;
    }

    if (
      bgmRef.current &&
      bgmRef.current.dataset.mode === 'classic' &&
      !bgmRef.current.paused
    ) {
      bgmRef.current.volume = Math.min(1, volume * 0.35);
      bgmRef.current.muted = isMuted || volume <= 0;
      return;
    }

    playClassicTrack();
  }, [isHalloween, isMuted, playClassicTrack, volume]);

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
    writeStorage(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    writeStorage(UI_LANGUAGE_STORAGE_KEY, uiLanguage);
  }, [uiLanguage]);

  useEffect(() => {
    writeStorage(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    writeStorage(
      COMPETITION_STORAGE_KEY,
      JSON.stringify({ config: competitionConfig })
    );
  }, [competitionConfig]);

  useEffect(() => {
    return () => {
      if (bgmRef.current) {
        bgmRef.current.onended = null;
        bgmRef.current.pause();
      }
      bgmRef.current = null;
      void audioCtxRef.current?.close();
      audioCtxRef.current = null;
    };
  }, []);

  const startGame = useCallback(() => {
    if (activeDeck.length === 0) return;

    setQueue(shuffle(activeDeck));
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
  }, [activeDeck, ensureAudioContext, startBgm]);

  const startNewRound = useCallback(() => {
    if (activeDeck.length === 0) return;

    setQueue(shuffle(activeDeck));
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
  }, [activeDeck, isHalloween, playTone]);

  const backToMenu = useCallback(() => {
    acceptingAnswersRef.current = false;
    setIsModalOpen(false);
    setScreen('menu');
    setCurrentQuestion(null);
    setCurrentNumber(null);
    setAnswerStatus(null);
    bgmRef.current?.pause();
  }, []);

  const openD20Setup = useCallback(() => {
    bgmRef.current?.pause();
    setScreen('d20-setup');
    playTone(392, 'triangle', 0.09, 0.055);
  }, [playTone]);

  const openCompetitionSetup = useCallback(() => {
    setPlayStyle('competition');
    bgmRef.current?.pause();
    setScreen('competition-setup');
    playTone(392, 'triangle', 0.09, 0.055);
  }, [playTone]);

  const openLiveRoom = useCallback(() => {
    window.location.href = `/host?mode=${mode}`;
  }, [mode]);

  const goHome = useCallback(() => {
    setMode('classic');
    setPlayStyle(null);
    setScreen('menu');
  }, []);

  const handlePrimaryAction = useCallback(() => {
    if (playStyle === 'd20') {
      openD20Setup();
    } else if (playStyle === 'competition') {
      openCompetitionSetup();
    } else if (playStyle === 'live') {
      openLiveRoom();
    }
  }, [openCompetitionSetup, openD20Setup, openLiveRoom, playStyle]);

  const startCompetition = useCallback(() => {
    if (competitionStudents.length < 2) return;
    if (isClassic && classicCategories.length === 0) return;

    setCompetitionRun((run) => run + 1);
    setScreen('competition');
    void ensureAudioContext();
    startBgm();
    playTone(392, 'triangle', 0.1, 0.06);
  }, [
    classicCategories.length,
    competitionStudents.length,
    ensureAudioContext,
    isClassic,
    playTone,
    startBgm,
  ]);

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
      const reshuffled = shuffle(activeDeck);
      setQueue(reshuffled.slice(1));
      return reshuffled[0];
    }

    const [next, ...rest] = queue;
    setQueue(rest);
    return next;
  }, [activeDeck, queue]);

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

  const toggleClassicCategory = (categoryId: ClassicCategoryId) => {
    setClassicCategories((previous) =>
      previous.includes(categoryId)
        ? previous.filter((id) => id !== categoryId)
        : [...previous, categoryId]
    );
  };

  const themeClass = isHalloween
    ? 'theme-halloween'
    : theme === 'dark'
      ? 'theme-dark'
      : 'theme-light';

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={cn(
          'game-shell relative flex min-h-dvh w-full flex-col font-sans',
          themeClass,
          screen === 'playing' ? 'h-dvh overflow-hidden' : 'overflow-x-hidden'
        )}
      >
        {isHalloween && (
          <HalloweenBackdrop dimmed={screen !== 'menu'} />
        )}

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
                <button
                  type="button"
                  onClick={goHome}
                  className="rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--ink)] shadow-[var(--tile-shadow)] transition hover:brightness-105"
                >
                  Supp
                </button>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setScreen('events')}
                    className="flex h-9 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 text-[11px] font-black uppercase tracking-wide text-[var(--accent)] transition hover:brightness-105"
                  >
                    <CalendarHeart className="h-4 w-4" aria-hidden="true" />
                    {c.specialEvents}
                  </button>
                  {!isHalloween && (
                    <ThemeToggle theme={theme} onChange={setTheme} />
                  )}
                  <LanguageToggle
                    language={uiLanguage}
                    onChange={setUiLanguage}
                    label={uiLanguage === 'pt' ? 'Idioma da interface' : 'Interface language'}
                  />
                </div>
              </div>

              <header className="mt-8">
                <h1
                  className={cn(
                    'text-balance text-4xl font-black uppercase leading-[0.95] tracking-tight text-[var(--ink)] sm:text-6xl',
                    isHalloween && 'hw-title'
                  )}
                >
                  {titleLines[0]}
                  {titleLines[1] && (
                    <>
                      <br />
                      {titleLines[1]}
                    </>
                  )}
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold text-[var(--muted)] sm:text-base">
                  {subtitle}
                </p>
              </header>

              <section aria-label={c.gameModes} className="mt-8">
                <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                    {c.chooseMode}
                  </h2>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  {[
                    {
                      id: 'd20' as PlayStyle,
                      label: c.modes.d20.label,
                      tagline: c.modes.d20.tagline,
                      description: c.modes.d20.description,
                      Icon: Dices,
                    },
                    {
                      id: 'competition' as PlayStyle,
                      label: c.modes.competition.label,
                      tagline: c.modes.competition.tagline,
                      description: c.modes.competition.description,
                      Icon: Trophy,
                    },
                    {
                      id: 'live' as PlayStyle,
                      label: c.modes.live.label,
                      tagline: c.modes.live.tagline,
                      description: c.modes.live.description,
                      Icon: Wifi,
                    },
                  ].map((item) => {
                    const selected = playStyle === item.id;

                    return (
                      <motion.button
                        key={item.id}
                        type="button"
                        aria-pressed={selected}
                        whileHover={{ y: -2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => setPlayStyle(item.id)}
                        className={cn(
                          'rounded-2xl border-2 p-4 text-left transition-colors sm:p-5',
                          selected
                            ? 'border-[var(--accent)] bg-[var(--surface-2)] shadow-[var(--panel-shadow)]'
                            : 'border-[var(--line-soft)] bg-[var(--surface)] hover:border-[var(--line)]'
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span
                            className={cn(
                              'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2',
                              selected
                                ? 'border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]'
                                : 'border-[var(--line-soft)] text-[var(--muted)]'
                            )}
                          >
                            <item.Icon className="h-5 w-5" aria-hidden="true" />
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
                        <h3 className="mt-3 text-lg font-black text-[var(--ink)]">
                          {item.label}
                        </h3>
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
              </section>

              <div className="mt-8 flex flex-col gap-3 border-t-2 border-[var(--line-soft)] pt-6 sm:flex-row sm:items-center">
                <a
                  href="/join"
                  className="flex min-h-[56px] items-center justify-center gap-2 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-5 text-sm font-black uppercase tracking-wide text-[var(--ink)] transition hover:border-[var(--accent)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <Smartphone className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                  {c.joinRoom}
                </a>

                <motion.button
                  type="button"
                  whileHover={canStartRound ? { scale: 1.02 } : undefined}
                  whileTap={canStartRound ? { scale: 0.97 } : undefined}
                  onClick={handlePrimaryAction}
                  disabled={!canStartRound}
                  className="flex min-h-[56px] flex-1 items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-6 text-base font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--panel-shadow)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:brightness-100 sm:text-lg"
                >
                  {playStyle === 'live' ? (
                    <Wifi className="h-5 w-5" aria-hidden="true" />
                  ) : playStyle === 'competition' ? (
                    <Trophy className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <Sparkles className="h-5 w-5" aria-hidden="true" />
                  )}
                  {playStyle === null
                    ? c.chooseModeToStart
                    : playStyle === 'live'
                      ? c.createLiveRoom
                      : playStyle === 'competition'
                        ? c.setupCompetition
                        : c.configureD20}
                  <ChevronRight className="h-5 w-5" aria-hidden="true" />
                </motion.button>
              </div>
            </motion.main>
          )}

          {screen === 'events' && (
            <motion.main
              key="events"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}
              className="relative z-10 mx-auto flex min-h-dvh w-full max-w-6xl flex-col justify-center px-4 py-8 sm:px-8"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setScreen('menu')}
                  className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  {c.events.back}
                </button>
                <span className="rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                  {c.events.badge}
                </span>
              </div>

              <header className="mt-6 sm:mt-8">
                <h1 className="text-balance text-4xl font-black uppercase leading-[0.95] tracking-tight text-[var(--ink)] sm:text-6xl">
                  {c.events.title[0]}
                  <br />
                  {c.events.title[1]}
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold text-[var(--muted)] sm:text-base">
                  {c.events.subtitle}
                </p>
              </header>

              <section aria-label={c.availableEvents} className="mt-6 grid gap-3 sm:grid-cols-3">
                <motion.button
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => {
                    setMode('halloween');
                    setPlayStyle(null);
                    setScreen('menu');
                  }}
                  className="relative overflow-hidden rounded-2xl border-4 border-[var(--accent)] bg-[var(--surface)] p-4 text-left shadow-[var(--panel-shadow)] transition-colors hover:bg-[var(--surface-2)] sm:p-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]">
                      <Ghost className="h-5 w-5" aria-hidden="true" />
                    </span>
                    <span className="rounded-full border-2 border-[var(--accent)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                      {c.events.liveNow}
                    </span>
                  </div>
                  <h2 className="mt-3 text-xl font-black text-[var(--ink)]">{c.events.halloween}</h2>
                  <p className="mt-1 text-xs font-medium leading-relaxed text-[var(--muted)]">
                    {c.events.halloweenDescription}
                  </p>
                  <span className="mt-3 flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-[var(--accent)]">
                    {c.events.openEvent} <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </motion.button>

                {[
                  {
                    id: 'christmas',
                    label: c.events.christmas,
                    description: c.events.christmasDescription,
                    Icon: Snowflake,
                  },
                  {
                    id: 'easter',
                    label: c.events.easter,
                    description: c.events.easterDescription,
                    Icon: Egg,
                  },
                ].map((event) => (
                  <div
                    key={event.id}
                    aria-disabled="true"
                    className="relative overflow-hidden rounded-2xl border-2 border-dashed border-[var(--line-soft)] bg-[var(--surface)] p-4 opacity-70 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--line-soft)] text-[var(--muted)]">
                        <event.Icon className="h-5 w-5" aria-hidden="true" />
                      </span>
                      <span className="rounded-full border border-[var(--line-soft)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-[var(--muted)]">
                        {c.events.comingSoon}
                      </span>
                    </div>
                    <h2 className="mt-3 text-xl font-black text-[var(--ink)]">{event.label}</h2>
                    <p className="mt-1 text-xs font-medium leading-relaxed text-[var(--muted)]">
                      {event.description}
                    </p>
                  </div>
                ))}
              </section>

              <button
                type="button"
                onClick={() => {
                  setMode('classic');
                  setPlayStyle(null);
                  setScreen('menu');
                }}
                className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 text-left transition hover:border-[var(--accent)] sm:p-5"
              >
                <span className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border-2 border-[var(--accent)] bg-[var(--cta-bg)] text-[var(--cta-text)]">
                    <GraduationCap className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-lg font-black text-[var(--ink)]">
                      {c.events.defaultGames}
                    </span>
                    <span className="mt-0.5 block text-xs font-medium leading-relaxed text-[var(--muted)]">
                      {c.events.defaultGamesDescription}
                    </span>
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              </button>

              <div className="mt-7">
                <p className="text-xs font-semibold leading-relaxed text-[var(--muted)]">
                  {c.events.more}
                </p>
              </div>
            </motion.main>
          )}

          {screen === 'd20-setup' && (
            <D20Setup
              key="d20-setup"
              mode={mode}
              uiLanguage={uiLanguage}
              language={language}
              difficulty={difficulty}
              categories={classicCategories}
              onDifficultyChange={setDifficulty}
              onCategoriesChange={setClassicCategories}
              onLanguageChange={setLanguage}
              onStart={startGame}
              onBack={backToMenu}
            />
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
                    aria-label={c.playing.menu}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:px-3"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{c.playing.menu}</span>
                  </button>

                  <div className="min-w-0">
                    <h1 className="flex items-center gap-1.5 truncate text-base font-black uppercase tracking-tight text-[var(--ink)] sm:text-2xl">
                      {isHalloween ? (
                        <Ghost className="h-4 w-4 shrink-0 text-[var(--accent)] sm:h-5 sm:w-5" aria-hidden="true" />
                      ) : (
                        <GraduationCap className="h-4 w-4 shrink-0 text-[var(--accent)] sm:h-5 sm:w-5" aria-hidden="true" />
                      )}
                      {isHalloween ? c.playing.halloweenTitle : c.playing.title}
                    </h1>
                    <p className="truncate text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] sm:text-xs">
                      {isHalloween
                        ? `${difficultyMeta.label} · ${difficultyMeta.tagline}`
                        : `${difficultyMeta.label} · ${classicCategories.length}/${CLASSIC_CATEGORIES.length} ${c.topicsWord}`}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <div
                    className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 text-xs font-black text-[var(--ink)]"
                    aria-label={`${c.playing.scoreLabel}: ${score.correct}/${score.total}`}
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
                      aria-label={`${c.playing.streakLabel}: ${streak}`}
                    >
                      <Flame className="h-4 w-4" aria-hidden="true" />
                      {streak}
                    </motion.div>
                  )}

                  <LanguageToggle
                    language={language}
                    onChange={setLanguage}
                    label={c.questionLanguage}
                  />

                  <VolumeControl
                    volume={volume}
                    muted={isMuted}
                    uiLanguage={uiLanguage}
                    onVolumeChange={handleVolumeChange}
                    onToggleMute={toggleMute}
                  />

                  <button
                    type="button"
                    onClick={startNewRound}
                    aria-label={c.playing.newRound}
                    className="flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
                  >
                    <RotateCcw className="h-4 w-4" aria-hidden="true" />
                    <span className="hidden sm:inline">{c.playing.newRound}</span>
                  </button>
                </div>
              </header>

              <main className="flex min-h-0 flex-1 flex-col gap-2 p-2 sm:gap-3 sm:p-4">
                <div className="flex shrink-0 items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[var(--muted)] sm:gap-3 sm:text-xs">
                  <span className="whitespace-nowrap">{c.playing.roundProgress}</span>
                  <div
                    role="progressbar"
                    aria-label={c.playing.roundProgress}
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
                      {c.playing.bestStreak} {bestStreak}
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
                      {c.playing.roundDone}
                    </span>
                    <button
                      type="button"
                      onClick={startNewRound}
                      className="rounded-lg border-2 border-[var(--line)] bg-[var(--cta-bg)] px-3 py-1 text-[11px] font-black uppercase text-[var(--cta-text)]"
                    >
                      {c.playing.newRound}
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
                      aria-label={`${c.playing.openQuestion} ${number}`}
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
              mode={mode}
              students={competitionStudents}
              config={competitionConfig}
              categories={classicCategories}
              language={language}
              uiLanguage={uiLanguage}
              onStudentsChange={setCompetitionStudents}
              onConfigChange={setCompetitionConfig}
              onCategoriesChange={setClassicCategories}
              onLanguageChange={setLanguage}
              onStart={startCompetition}
              onBack={backToMenu}
            />
          )}

          {screen === 'competition' && (
            <CompetitionGame
              key={`competition-${competitionRun}`}
              mode={mode}
              students={competitionStudents}
              config={competitionConfig}
              categories={classicCategories}
              language={language}
              uiLanguage={uiLanguage}
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
              language={language}
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
