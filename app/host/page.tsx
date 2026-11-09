'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Check,
  Ghost,
  Languages,
  Play,
  RotateCcw,
  Timer,
  Trophy,
  UserPlus,
  Wifi,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import HalloweenBackdrop from '@/components/HalloweenBackdrop';
import LanguageToggle from '@/components/LanguageToggle';
import ThemeToggle from '@/components/ThemeToggle';
import { CLASSIC_ALL_CATEGORIES, CLASSIC_CATEGORIES } from '@/lib/classic-questions';
import { DIFFICULTIES } from '@/lib/game';
import { localizeLiveQuestions, type Language } from '@/lib/i18n';
import { HOST_COPY } from '@/lib/i18n/host-copy';
import { categoryCopy, difficultyCopy } from '@/lib/i18n/game-copy';
import { PASSAPORTE_DECKS, type PassaporteDeck } from '@/lib/passaporte-decks';
import {
  channelNameFor,
  type HostToPlayerMessage,
  type LiveGameConfig,
  type LiveScoreRow,
  MAX_PLAYERS,
} from '@/lib/live/protocol';
import { getSupabaseClient } from '@/lib/live/supabase';
import { readStorage, writeStorage, removeStorage } from '@/lib/storage';
import {
  ANSWER_BUTTONS,
  buildQuestionRun,
  formatPoints,
  getLiveDeck,
  prepareQuestion,
  randomId,
  randomRoomCode,
  sanitizeRoomCode,
  scoreForAnswer,
  sortLeaderboard,
} from '@/lib/live/room';
import type { ClassicCategoryId, DifficultyId, ModeId, Theme } from '@/lib/types';

type Phase = 'setup' | 'lobby' | 'question' | 'reveal' | 'over';

type HostPlayer = {
  id: string;
  name: string;
};

type Reply = {
  playerId: string;
  name: string;
  optionIndex: number;
  elapsedMs: number;
};

type ScoreEntry = {
  name: string;
  total: number;
  streak: number;
};

const HOST_SESSION_KEY = 'live-host';
/** Remembers the half-time translation switch between visits. */
const TRANSLATE_AT_HALF_KEY = 'live-translate-at-half';

type SavedSession = {
  code: string;
  config: LiveGameConfig;
};

function readTranslateAtHalfSetting(): boolean {
  return readStorage(TRANSLATE_AT_HALF_KEY) === '1';
}

function readSavedSession(): SavedSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = readStorage(HOST_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SavedSession>;
    if (typeof parsed.code === 'string' && parsed.config && typeof parsed.config === 'object') {
      const { code } = parsed;
      const { difficulty, questionCount, secondsPerQuestion } = parsed.config;
      if (code && difficulty) {
        // Sessions saved before the Supp rebrand had no mode: they were Halloween rooms.
        const mode: ModeId =
          parsed.config.mode === 'classic'
            ? 'classic'
            : parsed.config.mode === 'halloween'
              ? 'halloween'
              : 'halloween';
        const categories = Array.isArray(parsed.config.categories)
          ? parsed.config.categories.filter((id): id is ClassicCategoryId =>
              CLASSIC_CATEGORIES.some((category) => category.id === id)
            )
          : undefined;
        const language: Language = parsed.config.language === 'en' ? 'en' : 'pt';
        const theme: Theme = parsed.config.theme === 'dark' ? 'dark' : 'light';

        return {
          code,
          config: {
            mode,
            language,
            theme,
            difficulty,
            questionCount: questionCount ?? 12,
            secondsPerQuestion: secondsPerQuestion ?? 20,
            showQuestionOnPlayer: parsed.config.showQuestionOnPlayer !== false,
            translateAtHalf: parsed.config.translateAtHalf === true,
            categories: categories && categories.length > 0 ? categories : undefined,
          },
        };
      }
    }
  } catch {
    return null;
  }
  return null;
}

function saveSavedSession(session: SavedSession) {
  writeStorage(HOST_SESSION_KEY, JSON.stringify(session));
}

function clearSavedSession() {
  removeStorage(HOST_SESSION_KEY);
}

/** Reads `?deck=<id>` on the client. Returns null during SSR or for unknown ids. */
function readPassaporteDeckFromUrl(): PassaporteDeck | null {
  if (typeof window === 'undefined') return null;
  const requestedDeck = new URLSearchParams(window.location.search).get('deck');
  if (!requestedDeck) return null;
  if (!Object.prototype.hasOwnProperty.call(PASSAPORTE_DECKS, requestedDeck)) return null;
  return PASSAPORTE_DECKS[requestedDeck];
}

/** The deck always runs the whole lesson; keep the rounds card in sync. */
function initialQuestionCount(): 8 | 12 | 16 {
  const count = readPassaporteDeckFromUrl()?.questions.length;
  if (count === 8 || count === 12 || count === 16) return count;
  return 12;
}

/** Default delay between the reveal and the next question. */
const REVEAL_ADVANCE_MS = 7000;
/** Classroom mode (`?auto=1`) moves on a little faster. */
const REVEAL_ADVANCE_CLASS_MS = 6000;

/** Reads `?room=<code>`: a fixed room code for classroom use. */
function readRoomCodeFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('room');
  if (!raw) return null;
  return sanitizeRoomCode(raw);
}

/** Reads `?seconds=15|20|30`; anything else keeps the 20 s default. */
function readSecondsFromUrl(): 15 | 20 | 30 | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('seconds');
  if (raw === '15' || raw === '20' || raw === '30') return Number(raw) as 15 | 20 | 30;
  return null;
}

/** Reads `?auto=1` (on, 6 s) / `?auto=0` (off); absent keeps the default. */
function readAutoFromUrl(): boolean | null {
  if (typeof window === 'undefined') return null;
  const raw = new URLSearchParams(window.location.search).get('auto');
  if (raw === '1') return true;
  if (raw === '0') return false;
  return null;
}

/** Reads `?start=1`: opens the room automatically (used by /aula → /host). */
function readStartFromUrl(): boolean {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('start') === '1';
}

const ROUND_LENGTHS: { value: 8 | 12 | 16 }[] = [
  { value: 8 },
  { value: 12 },
  { value: 16 },
];

const ROUND_SECONDS: { value: 15 | 20 | 30 }[] = [
  { value: 15 },
  { value: 20 },
  { value: 30 },
];

export default function HostPage() {
  const [mode, setMode] = useState<ModeId>('classic');
  const [language, setLanguage] = useState<Language>('pt');
  const [theme, setTheme] = useState<Theme>('light');
  const [uiLanguage, setUiLanguage] = useState<Language>('pt');
  const [categories, setCategories] = useState<ClassicCategoryId[]>(
    CLASSIC_ALL_CATEGORIES
  );
  const [mounted, setMounted] = useState(false);
  const [realtimeReady, setRealtimeReady] = useState(false);
  const [passaporteDeck, setPassaporteDeck] = useState<PassaporteDeck | null>(
    readPassaporteDeckFromUrl
  );
  /* `?room=CODE`: when present it wins over the random code and saved sessions. */
  const [forcedRoomCode] = useState<string | null>(readRoomCodeFromUrl);

  useEffect(() => {
    setMounted(true);
    autoStartWantedRef.current = readStartFromUrl();

    if (readStorage('theme') === 'dark') setTheme('dark');
    if (readStorage('ui-language') === 'en') setUiLanguage('en');

    const params = new URLSearchParams(window.location.search);
    const requestedMode = params.get('mode');
    if (requestedMode === 'classic' || requestedMode === 'halloween') {
      setMode(requestedMode);
    }

    const requestedCategories = params.get('categories');
    if (requestedCategories) {
      const parsed = requestedCategories
        .split(',')
        .filter((id): id is ClassicCategoryId =>
          CLASSIC_CATEGORIES.some((category) => category.id === id)
        );
      if (parsed.length > 0) setCategories(parsed);
    }

    const requestedLanguage = params.get('lang');
    if (requestedLanguage === 'en' || requestedLanguage === 'pt') {
      setLanguage(requestedLanguage);
    } else {
      setLanguage(readStorage('language') === 'en' ? 'en' : 'pt');
    }

    const requestedDifficulty = params.get('difficulty');
    if (
      requestedDifficulty === 'easy' ||
      requestedDifficulty === 'medium' ||
      requestedDifficulty === 'hard'
    ) {
      setDifficulty(requestedDifficulty);
    }

    setRealtimeReady(
      Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
    );
  }, []);

  const [phase, setPhase] = useState<Phase>('setup');
  const [difficulty, setDifficulty] = useState<DifficultyId>('medium');
  const [questionCount, setQuestionCount] = useState<8 | 12 | 16>(initialQuestionCount);
  const [secondsPerQuestion, setSecondsPerQuestion] = useState<15 | 20 | 30>(
    () => readSecondsFromUrl() ?? 20
  );
  const [showQuestionOnPlayer, setShowQuestionOnPlayer] = useState(true);
  const [translateAtHalf, setTranslateAtHalf] = useState(readTranslateAtHalfSetting);

  const [code, setCode] = useState(forcedRoomCode ?? '');
  const [joinUrl, setJoinUrl] = useState('');

  const [players, setPlayers] = useState<HostPlayer[]>([]);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [scores, setScores] = useState<Record<string, ScoreEntry>>({});
  const [run, setRun] = useState<ReturnType<typeof buildQuestionRun>>([]);
  const [seq, setSeq] = useState(0);
  const [question, setQuestion] = useState<ReturnType<typeof prepareQuestion> | null>(null);
  const [reveal, setReveal] = useState<{
    seq: number;
    correctIndex: number;
    counts: number[];
    explanation: string;
    leaderboard: LiveScoreRow[];
  } | null>(null);
  const [msLeft, setMsLeft] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  /** Turns on halfway through the question when the deck carries a translation. */
  const [showTranslation, setShowTranslation] = useState(false);
  const [status, setStatus] = useState<'idle' | 'connecting' | 'live'>('idle');
  const [savedSession, setSavedSession] = useState<SavedSession | null>(null);

  useEffect(() => {
    writeStorage('language', language);
  }, [language]);

  useEffect(() => {
    writeStorage('theme', theme);
  }, [theme]);

  useEffect(() => {
    writeStorage(TRANSLATE_AT_HALF_KEY, translateAtHalf ? '1' : '0');
  }, [translateAtHalf]);

  useEffect(() => {
    setSavedSession(readSavedSession());
  }, []);

  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null>(null);
  const runRef = useRef<ReturnType<typeof buildQuestionRun>>([]);
  const seqRef = useRef(0);
  const scoresRef = useRef<Record<string, ScoreEntry>>({});
  const repliesRef = useRef<Reply[]>([]);
  const questionRef = useRef<ReturnType<typeof prepareQuestion> | null>(null);
  const startedAtRef = useRef(0);
  const timeoutRef = useRef<number | null>(null);
  const phaseRef = useRef<Phase>('setup');
  const lastHostMessageRef = useRef<HostToPlayerMessage | null>(null);
  const playerCountRef = useRef(0);
  const endQuestionRef = useRef<((seqIndex: number) => void) | null>(null);
  const nextQuestionRef = useRef<(() => void) | null>(null);
  /* Pending auto-advance timer (reveal screen), separate from the question timer. */
  const advanceRef = useRef<number | null>(null);
  const lastAdvanceAtRef = useRef(0);
  const revealedIdsRef = useRef<Set<string>>(new Set());
  /* `?start=1`: the room must open once, automatically, without a click. */
  const autoStartWantedRef = useRef(false);
  const autoStartedRef = useRef(false);
  const [podiumStep, setPodiumStep] = useState(0);
  phaseRef.current = phase;
  playerCountRef.current = players.length;

  const liveConfig = useMemo<LiveGameConfig>(
    () => ({
      mode,
      language,
      theme,
      difficulty,
      questionCount,
      secondsPerQuestion,
      showQuestionOnPlayer,
      translateAtHalf,
      categories: mode === 'classic' ? categories : undefined,
    }),
    [
      categories,
      difficulty,
      language,
      mode,
      questionCount,
      secondsPerQuestion,
      showQuestionOnPlayer,
      translateAtHalf,
      theme,
    ]
  );

  const toggleCategory = (categoryId: ClassicCategoryId) => {
    setCategories((previous) =>
      previous.includes(categoryId)
        ? previous.filter((id) => id !== categoryId)
        : [...previous, categoryId]
    );
  };

  const clearPassaporteDeck = useCallback(() => {
    setPassaporteDeck(null);
    if (typeof window === 'undefined') return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has('deck')) return;
    url.searchParams.delete('deck');
    window.history.replaceState(null, '', `${url.pathname}${url.search}${url.hash}`);
  }, []);

  const canOpenRoom = Boolean(passaporteDeck) || mode !== 'classic' || categories.length > 0;

  const broadcast = useCallback((payload: HostToPlayerMessage) => {
    lastHostMessageRef.current = payload;
    channelRef.current?.send({
      type: 'broadcast',
      event: 'host',
      payload,
    });
  }, []);

  /* ------------------------------------------------------------------ */
  /* Channel lifecycle                                                   */
  /* ------------------------------------------------------------------ */

  const openRoom = useCallback(async (preferredCode?: string) => {
    const client = getSupabaseClient();
    if (!client) return;

    setStatus('connecting');
    const sanitizedPreferred =
      preferredCode && sanitizeRoomCode(preferredCode) ? preferredCode : null;
    const roomCode = forcedRoomCode ?? sanitizedPreferred ?? randomRoomCode();
    const channel = client.channel(channelNameFor(roomCode), {
      config: { presence: { key: randomId('host') } },
    });

    channel
      .on('broadcast', { event: 'player' }, ({ payload }) => {
        const message = payload as { kind?: string };
        if (message?.kind !== 'answer') return;
        const answer = payload as unknown as {
          kind: 'answer';
          playerId: string;
          name: string;
          seq: number;
          optionIndex: number;
        };

        // Only accept answers for the live question, once per player.
        if (answer.seq !== seqRef.current) return;
        if (repliesRef.current.some((r) => r.playerId === answer.playerId)) return;

        const elapsedMs = Math.max(Date.now() - startedAtRef.current, 0);
        const entry: Reply = {
          playerId: answer.playerId,
          name: answer.name.slice(0, 16),
          optionIndex: answer.optionIndex,
          elapsedMs,
        };
        repliesRef.current = [...repliesRef.current, entry];
        setReplies(repliesRef.current);

        // Everyone has voted: jump to the reveal right away for a lively pace.
        // Guarded so a duplicated reply event (double channel echo) or a
        // late straggler reply can't fire the reveal twice for the same question.
        if (
          phaseRef.current === 'question' &&
          answer.seq === seqRef.current &&
          playerCountRef.current > 0 &&
          repliesRef.current.length >= playerCountRef.current
        ) {
          if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
          endQuestionRef.current?.(answer.seq);
        }
      })
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState() as Record<string, { name?: string }[]>;
        const next: HostPlayer[] = [];
        for (const [id, metas] of Object.entries(state)) {
          if (id.startsWith('host-')) continue;
          const name = metas[0]?.name;
          // The presence key IS the player id, so scores and answers line up.
          if (name) next.push({ id, name: String(name).slice(0, 16) });
        }
        next.sort((a, b) => a.name.localeCompare(b.name));
        setPlayers(next);
      })
      .on('presence', { event: 'join' }, () => {
        // Late joiners: lobby snapshot, or the current game screen they missed.
        const phaseNow = phaseRef.current;
        channelRef.current?.send({
          type: 'broadcast',
          event: 'host',
          payload:
            phaseNow === 'lobby' || !lastHostMessageRef.current
              ? {
                  kind: 'lobby',
                  code: roomCode,
                  config: liveConfig,
                }
              : lastHostMessageRef.current,
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
          setCode(roomCode);
          setStatus('live');
          setPhase('lobby');
          const url = `${window.location.origin}/join?code=${roomCode}&mode=${liveConfig.mode}&theme=${liveConfig.theme}`;
          setJoinUrl(url);
          saveSavedSession({
            code: roomCode,
            config: liveConfig,
          });
          await channel.track({ name: 'HOST' });
        }
      });
  }, [broadcast, forcedRoomCode, liveConfig]);

  /* `?start=1`: open the room automatically, exactly once. Without the
     parameter nothing changes — the teacher still clicks "Abrir sala". */
  useEffect(() => {
    if (!mounted || !realtimeReady) return;
    if (!autoStartWantedRef.current || autoStartedRef.current) return;
    if (phase !== 'setup' || status !== 'idle' || !canOpenRoom) return;
    const timer = window.setTimeout(() => {
      /* Guard inside the callback: an effect re-run may have cancelled this
         timer, so the flag is only set once the room really opens. */
      if (autoStartedRef.current) return;
      autoStartedRef.current = true;
      void openRoom();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mounted, realtimeReady, phase, status, canOpenRoom, openRoom]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      const channel = channelRef.current;
      const client = getSupabaseClient();
      if (channel && client) void client.removeChannel(channel);
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* Game flow                                                           */
  /* ------------------------------------------------------------------ */

  const endQuestion = useCallback(
    (seqIndex: number) => {
      const current = questionRef.current;
      if (!current) return;

      // Fire at most once per question, even if a duplicate channel event or a
      // dev StrictMode double-mount reaches it in the same tick.
      if (revealedIdsRef.current.has(current.id)) return;
      revealedIdsRef.current.add(current.id);

      const counts = [0, 0, 0, 0];
      const rows: LiveScoreRow[] = [];
      const nextScores = { ...scoresRef.current };

      for (const reply of repliesRef.current) {
        counts[reply.optionIndex] = (counts[reply.optionIndex] ?? 0) + 1;
      }

      const playerNames = new Map(players.map((p) => [p.id, p.name]));
      for (const reply of repliesRef.current) {
        playerNames.set(reply.playerId, reply.name);
      }

      for (const [playerId, name] of playerNames) {
        const reply = repliesRef.current.find((r) => r.playerId === playerId);
        const previous = nextScores[playerId] ?? { name, total: 0, streak: 0 };
        const correct = Boolean(reply && reply.optionIndex === current.correctIndex);
        const gained = correct ? scoreForAnswer(reply!.elapsedMs, secondsPerQuestion * 1000) : 0;
        const streak = correct ? previous.streak + 1 : 0;

        nextScores[playerId] = { name, total: previous.total + gained, streak };
        rows.push({ playerId, name, total: nextScores[playerId].total, streak, gained, correct });
      }

      for (const [playerId, entry] of Object.entries(nextScores)) {
        if (!rows.some((r) => r.playerId === playerId)) {
          rows.push({ playerId, name: entry.name, total: entry.total, streak: entry.streak, gained: 0, correct: false });
        }
      }

      const leaderboard = sortLeaderboard(rows);
      scoresRef.current = nextScores;
      setScores(nextScores);
      setReveal({
        seq: seqIndex,
        correctIndex: current.correctIndex,
        counts,
        explanation:
          runRef.current.find((q) => q.id === current.id)?.explanation ?? '',
        leaderboard,
      });
      setReplies([]);
      repliesRef.current = [];
      setPhase('reveal');
      broadcast({
        kind: 'reveal',
        seq: seqIndex,
        questionId: current.id,
        text: current.text,
        options: current.options,
        correctIndex: current.correctIndex,
        explanation:
          runRef.current.find((q) => q.id === current.id)?.explanation ?? '',
        counts,
        leaderboard,
      } satisfies HostToPlayerMessage);

      // The 7 s auto-advance timer itself lives in the reveal effect, so the
      // countdown and the jump share one single source of truth.
    },
    [broadcast, players, secondsPerQuestion]
  );
  endQuestionRef.current = endQuestion;

  const askQuestion = useCallback(
    (seqIndex: number) => {
      const current = runRef.current[seqIndex];
      if (!current) return;

      const prepared = prepareQuestion(current);
      questionRef.current = prepared;
      const now = Date.now();
      startedAtRef.current = now;
      repliesRef.current = [];
      setQuestion(prepared);
      setReplies([]);
      setSeq(seqIndex);
      seqRef.current = seqIndex;
      setStartedAt(now);
      setMsLeft(secondsPerQuestion * 1000);
      setShowTranslation(false);
      setPhase('question');

      const timeoutMs = secondsPerQuestion * 1000;
      const offersTranslation = translateAtHalf && Boolean(prepared.textPt);

      broadcast({
        kind: 'question',
        seq: seqIndex,
        questionId: prepared.id,
        text: prepared.text,
        options: prepared.options,
        timeoutMs,
        startedAt: now,
        ...(offersTranslation
          ? {
              textPt: prepared.textPt,
              optionsPt: prepared.optionsPt,
              translateAtMs: Math.round(timeoutMs / 2),
            }
          : {}),
      } satisfies HostToPlayerMessage);

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (advanceRef.current) {
        window.clearTimeout(advanceRef.current);
        advanceRef.current = null;
      }
      timeoutRef.current = window.setTimeout(() => {
        endQuestion(seqIndex);
      }, timeoutMs);
    },
    [broadcast, endQuestion, secondsPerQuestion, translateAtHalf]
  );

  const startGame = useCallback(() => {
    const sourceQuestions = passaporteDeck
      ? passaporteDeck.questions
      : buildQuestionRun(mode, difficulty, questionCount, categories);
    const nextRun = localizeLiveQuestions(sourceQuestions, language);
    if (nextRun.length === 0) return;

    runRef.current = nextRun;
    setRun(nextRun);
    scoresRef.current = {};
    setScores({});
    revealedIdsRef.current = new Set();
    askQuestion(0);
  }, [askQuestion, categories, difficulty, language, mode, passaporteDeck, questionCount]);

  /* The question is read on the projector: enter fullscreen as the teacher hits play. */
  const enterFullscreen = useCallback(() => {
    if (typeof document === 'undefined' || document.fullscreenElement) return;
    void document.documentElement.requestFullscreen?.().catch(() => {
      // Browsers can refuse (permissions/iframe); the game still runs windowed.
    });
  }, []);

  const finishGame = useCallback(() => {
    const rows: LiveScoreRow[] = sortLeaderboard(
      Object.entries(scoresRef.current).map(([playerId, entry]) => ({
        playerId,
        name: entry.name,
        total: entry.total,
        streak: entry.streak,
        gained: 0,
        correct: false,
      }))
    );
    setReveal(null);
    setPhase('over');
    broadcast({ kind: 'gameover', leaderboard: rows });
  }, [broadcast]);

  const closeRoom = useCallback(() => {
    broadcast({ kind: 'roomclosed' });
    clearSavedSession();
    const channel = channelRef.current;
    const client = getSupabaseClient();
    if (channel && client) void client.removeChannel(channel);
    channelRef.current = null;
    window.location.href = '/';
  }, [broadcast]);

  const nextQuestion = useCallback(() => {
    // Debounce: the firing timer and a same-instant manual click must not
    // advance twice (and an accidental double-click gets absorbed too).
    const now = Date.now();
    if (now - lastAdvanceAtRef.current < 600) return;
    lastAdvanceAtRef.current = now;
    if (advanceRef.current) {
      window.clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
    const next = seqRef.current + 1;
    if (next >= runRef.current.length) {
      finishGame();
      return;
    }
    askQuestion(next);
  }, [askQuestion, finishGame]);
  nextQuestionRef.current = nextQuestion;

  /* Countdown for the auto-advance shown on the reveal screen. */
  const [revealCountdown, setRevealCountdown] = useState(7);

  /* Auto-advance: after the reveal the game moves on by itself. The host can
     switch it off and drive Next question manually instead. ON by default;
     `?auto=0` (used by /aula) starts it OFF. */
  const autoParam = readAutoFromUrl();
  const [autoAdvance, setAutoAdvance] = useState(() => autoParam ?? true);
  const autoAdvanceRef = useRef(autoParam ?? true);
  /* `?auto=1` shortens the reveal → next delay; without it the 7 s default stays. */
  const [revealAdvanceMs] = useState(() =>
    autoParam ? REVEAL_ADVANCE_CLASS_MS : REVEAL_ADVANCE_MS
  );
  const toggleAutoAdvance = useCallback((value: boolean) => {
    setAutoAdvance(value);
    autoAdvanceRef.current = value;
    if (!value && advanceRef.current) {
      // Turning it off mid-reveal stops the pending jump.
      window.clearTimeout(advanceRef.current);
      advanceRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (phase !== 'reveal') return;
    const delayMs = revealAdvanceMs;
    const startCountdown = Math.max(Math.round(delayMs / 1000), 1);
    if (autoAdvanceRef.current) {
      // Single source of truth for the jump (or ending the game).
      if (advanceRef.current) window.clearTimeout(advanceRef.current);
      advanceRef.current = window.setTimeout(() => {
        advanceRef.current = null;
        nextQuestionRef.current?.();
      }, delayMs);
    }
    setRevealCountdown(startCountdown);
    const interval = window.setInterval(() => {
      setRevealCountdown(
        autoAdvanceRef.current ? (current) => Math.max(current - 1, 0) : startCountdown
      );
    }, 1000);
    return () => {
      window.clearInterval(interval);
      // Also kills the pending jump the moment the phase changes again
      // (manual Next, toggle off, finish, …), avoiding stale double jumps.
      if (advanceRef.current) {
        window.clearTimeout(advanceRef.current);
        advanceRef.current = null;
      }
    };
  }, [phase, autoAdvance, revealAdvanceMs]);

  /* Ticker for the projected countdown bar. */

  /* Ticker for the projected countdown bar. */
  useEffect(() => {
    if (phase !== 'question') return;
    const tick = window.setInterval(() => {
      setMsLeft(Math.max(startedAtRef.current + secondsPerQuestion * 1000 - Date.now(), 0));
    }, 200);
    return () => window.clearInterval(tick);
  }, [phase, secondsPerQuestion, startedAt]);

  /* Half-time translation on the projector: same clock as the countdown bar,
     so the PT block appears exactly when the timer crosses the halfway mark. */
  useEffect(() => {
    setShowTranslation(false);
    if (phase !== 'question' || !translateAtHalf) return;
    if (!question?.textPt) return;

    const translateAtMs = Math.round((secondsPerQuestion * 1000) / 2);
    const delay = Math.max(startedAt + translateAtMs - Date.now(), 0);
    const timer = window.setTimeout(() => setShowTranslation(true), delay);
    return () => window.clearTimeout(timer);
  }, [phase, question, secondsPerQuestion, startedAt, translateAtHalf]);

  /* Does the currently selected deck carry any Portuguese translation? */
  const translationAvailable = useMemo(() => {
    const deck = passaporteDeck
      ? passaporteDeck.questions
      : getLiveDeck(mode, difficulty, categories);
    return deck.some((item) => Boolean(item.textPt));
  }, [categories, difficulty, mode, passaporteDeck]);

  useEffect(() => {
    if (phase !== 'lobby') return;
    broadcast({
      kind: 'lobby',
      code,
      config: liveConfig,
    } satisfies HostToPlayerMessage);
  }, [phase, players, broadcast, code, liveConfig]);

  /* Final standings, plus the staggered podium reveal (3rd → 2nd → 1st). */
  const finalRows = useMemo(
    () =>
      sortLeaderboard(
        Object.entries(scores).map(([playerId, entry]) => ({
          playerId,
          name: entry.name,
          total: entry.total,
          streak: entry.streak,
          gained: 0,
          correct: false,
        })),
      ),
    [scores],
  );

  useEffect(() => {
    if (phase !== 'over') return;
    setPodiumStep(0);
    const timers = [1, 2, 3].map((step, order) =>
      window.setTimeout(() => setPodiumStep((current) => Math.max(current, step)), 1400 + order * 2200),
    );
    return () => timers.forEach((t) => window.clearTimeout(t));
  }, [phase]);

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const themeClass =
    mode === 'halloween'
      ? 'theme-halloween'
      : theme === 'dark'
        ? 'theme-dark'
        : 'theme-light';
  const copy = HOST_COPY[uiLanguage];

  if (!mounted) {
    return (
      <main
        className={`game-shell ${themeClass} relative flex min-h-dvh items-center justify-center`}
      >
        {mode === 'halloween' && <HalloweenBackdrop dimmed />}
        <span className="relative z-10 h-10 w-10 animate-pulse rounded-full bg-[var(--surface-2)]" />
      </main>
    );
  }

  if (!realtimeReady) {
    return (
      <main
        className={`${themeClass} game-shell relative flex min-h-dvh items-center justify-center px-4`}
      >
        {mode === 'halloween' && <HalloweenBackdrop dimmed />}
        <div className="relative z-10 max-w-md rounded-2xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 text-center">
          <Wifi className="mx-auto h-8 w-8 text-[var(--muted)]" aria-hidden="true" />
          <h1 className="mt-3 text-xl font-black text-[var(--ink)]">{copy.realtimeTitle}</h1>
          <p className="mt-2 text-sm font-medium text-[var(--muted)]">
            {copy.realtimeHelp}
          </p>
          <a
            href="/"
            className="mt-5 inline-block rounded-xl bg-[var(--cta-bg)] px-4 py-2 text-sm font-black text-[var(--cta-text)]"
          >
            {copy.backToMenu}
          </a>
        </div>
      </main>
    );
  }

  return (
    <main
      className={`game-shell ${themeClass} relative flex min-h-dvh w-full flex-col items-center px-4 py-6 sm:px-8`}
    >
      {mode === 'halloween' && (
        <HalloweenBackdrop dimmed={phase !== 'lobby'} />
      )}

      <div className="relative z-10 w-full max-w-4xl">
        <div className="flex items-center justify-between gap-3">
          {phase === 'setup' ? (
            <a
              href="/"
              className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)]"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.menu}
            </a>
          ) : (
            <button
              type="button"
              onClick={closeRoom}
              className="flex items-center gap-1.5 rounded-full border-2 border-[var(--danger)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--danger)] transition hover:bg-[var(--danger)]/10"
            >
              <X className="h-3.5 w-3.5" aria-hidden="true" />
              {copy.closeRoom}
            </button>
          )}
          <div className="flex items-center gap-2">
            {mode !== 'halloween' && (
              <ThemeToggle theme={theme} onChange={setTheme} />
            )}
            <span className="rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
              {mode === 'halloween' ? copy.halloweenLiveHost : copy.liveHost}
            </span>
          </div>
        </div>

        {phase === 'setup' && (
            <motion.section
              key="setup"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-8 rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8"
            >
              <h1 className="text-3xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-4xl">
                {copy.createRoom}
              </h1>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)] sm:text-base">
                {copy.createRoomHelp}
              </p>

              {passaporteDeck ? (
                <div className="mt-6 rounded-2xl border-4 border-[var(--accent)] bg-[var(--surface-2)] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                        Baralho da aula
                      </p>
                      <p className="mt-1 text-base font-black text-[var(--ink)]">
                        Aula do dia · {passaporteDeck.title} · {passaporteDeck.questions.length} perguntas
                      </p>
                      <p className="mt-1 text-[11px] font-medium text-[var(--muted)]">
                        Este baralho substitui a seleção de dificuldade, temas e rodadas. O tempo por
                        pergunta continua valendo.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={clearPassaporteDeck}
                      className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-black text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    >
                      usar quiz padrão
                    </button>
                  </div>
                </div>
              ) : null}

              {mode === 'classic' && (
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                      {copy.topics}
                    </h2>
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--accent)]">
                      {categories.length}/{CLASSIC_CATEGORIES.length}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-5">
                    {CLASSIC_CATEGORIES.map((category) => {
                      const selected = categories.includes(category.id);

                      return (
                        <button
                          key={category.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => toggleCategory(category.id)}
                          className={
                            selected
                              ? 'rounded-xl border-4 border-[var(--accent)] bg-[var(--surface-2)] px-2 py-2 text-xs font-black text-[var(--ink)]'
                              : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-2 text-xs font-black text-[var(--ink)] hover:border-[var(--line)]'
                          }
                        >
                          {categoryCopy(category.id, uiLanguage).label}
                        </button>
                      );
                    })}
                  </div>
                  {!passaporteDeck && categories.length === 0 && (
                    <p className="mt-2 rounded-xl border-2 border-[var(--danger)] px-3 py-2 text-[11px] font-bold text-[var(--danger)]">
                      {copy.selectTopic}
                    </p>
                  )}
                </div>
              )}

              <div className="mt-6 grid gap-5 sm:grid-cols-3">
                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{copy.deck}</h2>
                  <div className="mt-2 grid gap-2">
                    {DIFFICULTIES.map((item) => {
                      const selected = difficulty === item.id;
                      const difficultyText = difficultyCopy(item.id, uiLanguage);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setDifficulty(item.id)}
                          className={
                            selected
                              ? 'flex items-center justify-between rounded-xl border-4 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-left'
                              : 'flex items-center justify-between rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-left hover:border-[var(--line)]'
                          }
                        >
                          <span className="text-sm font-black text-[var(--ink)]">{difficultyText.label}</span>
                          <span className="text-[10px] font-bold uppercase text-[var(--accent)]">{difficultyText.audience}</span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-2 text-[11px] font-medium text-[var(--muted)]">
                    {copy.questionsReady(
                      passaporteDeck
                        ? passaporteDeck.questions.length
                        : getLiveDeck(mode, difficulty, categories).length
                    )}
                  </p>
                </div>

                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{copy.rounds}</h2>
                  <div className="mt-2 grid gap-2">
                    {ROUND_LENGTHS.map((item) => {
                      const selected = questionCount === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setQuestionCount(item.value)}
                          className={
                            selected
                              ? 'rounded-xl border-4 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm font-black text-[var(--ink)]'
                              : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm font-black text-[var(--ink)] hover:border-[var(--line)]'
                          }
                        >
                          {copy.questionCount(item.value)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{copy.timePerQuestion}</h2>
                  <div className="mt-2 grid gap-2">
                    {ROUND_SECONDS.map((item) => {
                      const selected = secondsPerQuestion === item.value;
                      return (
                        <button
                          key={item.value}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => setSecondsPerQuestion(item.value)}
                          className={
                            selected
                              ? 'flex items-center gap-2 rounded-xl border-4 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm font-black text-[var(--ink)]'
                              : 'flex items-center gap-2 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2 text-left text-sm font-black text-[var(--ink)] hover:border-[var(--line)]'
                          }
                        >
                          <Timer className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                          {copy.seconds(item.value)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="mt-5 flex items-center justify-between rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
                <div className="text-left">
                  <p className="text-sm font-black text-[var(--ink)]">{copy.autoAdvance}</p>
                  <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
                    {copy.autoAdvanceHelp}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoAdvance}
                  onClick={() => toggleAutoAdvance(!autoAdvance)}
                  className={`ml-4 flex min-w-20 flex-none items-center justify-center rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
                    autoAdvance
                      ? 'bg-[var(--accent)] text-white'
                      : 'border-2 border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]'
                  }`}
                >
                  {autoAdvance ? copy.on : copy.off}
                </button>
              </div>

              <div className="mt-4 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
                <p className="text-sm font-black text-[var(--ink)]">{copy.playerView}</p>
                <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
                  {copy.playerViewHelp}
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    aria-pressed={showQuestionOnPlayer}
                    onClick={() => setShowQuestionOnPlayer(true)}
                    className={
                      showQuestionOnPlayer
                        ? 'rounded-lg border-2 border-[var(--accent)] bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]'
                        : 'rounded-lg border-2 border-[var(--line-soft)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)] hover:border-[var(--line)]'
                    }
                  >
                    {copy.playerViewFull}
                  </button>
                  <button
                    type="button"
                    aria-pressed={!showQuestionOnPlayer}
                    onClick={() => setShowQuestionOnPlayer(false)}
                    className={
                      !showQuestionOnPlayer
                        ? 'rounded-lg border-2 border-[var(--accent)] bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]'
                        : 'rounded-lg border-2 border-[var(--line-soft)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)] hover:border-[var(--line)]'
                    }
                  >
                    {copy.playerViewShapes}
                  </button>
                </div>
              </div>

              <div className="mt-4 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-black text-[var(--ink)]">{copy.questionLanguage}</p>
                  <LanguageToggle
                    language={language}
                    onChange={setLanguage}
                    label={copy.questionLanguage}
                  />
                </div>
                <p className="mt-1 text-[11px] font-medium text-[var(--muted)]">
                  {copy.questionLanguageHelp}
                </p>
              </div>

              <div className="mt-4 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0 text-left">
                    <p className="flex items-center gap-1.5 text-sm font-black text-[var(--ink)]">
                      <Languages className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                      {copy.translateAtHalf}
                    </p>
                    <p className="mt-0.5 text-[11px] font-medium text-[var(--muted)]">
                      {copy.translateAtHalfHelp}
                    </p>
                    {!translationAvailable ? (
                      <p className="mt-1 text-[11px] font-bold text-[var(--accent)]">
                        {copy.translateAtHalfUnavailable}
                      </p>
                    ) : null}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={translateAtHalf}
                    onClick={() => setTranslateAtHalf((current) => !current)}
                    className={`ml-1 flex min-w-20 flex-none items-center justify-center rounded-full px-4 py-2 text-xs font-black uppercase tracking-wide transition-colors ${
                      translateAtHalf
                        ? 'bg-[var(--accent)] text-white'
                        : 'border-2 border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]'
                    }`}
                  >
                    {translateAtHalf ? copy.on : copy.off}
                  </button>
                </div>
              </div>

              <button
                type="button"
                disabled={status === 'connecting' || !canOpenRoom}
                onClick={() => void openRoom()}
                className="mt-7 w-full rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--tile-shadow)] disabled:opacity-60 sm:w-auto sm:min-w-64"
              >
                {status === 'connecting' ? copy.openingRoom : copy.openRoom}
              </button>

              {savedSession && savedSession.code !== code ? (
                <button
                  type="button"
                  disabled={status === 'connecting'}
                  onClick={() => {
                    setMode(savedSession.config.mode);
                    if (savedSession.config.categories?.length) {
                      setCategories(savedSession.config.categories);
                    }
                    setDifficulty(savedSession.config.difficulty);
                    setQuestionCount(savedSession.config.questionCount);
                    setSecondsPerQuestion(savedSession.config.secondsPerQuestion);
                    setShowQuestionOnPlayer(savedSession.config.showQuestionOnPlayer);
                    setTranslateAtHalf(savedSession.config.translateAtHalf === true);
                    void openRoom(savedSession.code);
                  }}
                  className="mt-3 block w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-5 py-2.5 text-sm font-black uppercase tracking-wide text-[var(--muted)] disabled:opacity-60 sm:w-auto sm:min-w-64"
                >
                  {copy.rejoin(savedSession.code)}
                </button>
              ) : null}
            </motion.section>
          )}

          {phase === 'lobby' && (
            <motion.section
              key="lobby"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
                  <h1 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{copy.roomCode}</h1>
                  <p
                    className={`mt-1 text-6xl font-black tracking-[0.14em] text-[var(--accent)] sm:text-7xl ${
                      mode === 'halloween' ? 'hw-title' : ''
                    }`}
                  >
                    {code}
                  </p>
                  <p className="mt-3 max-w-sm text-sm font-semibold text-[var(--muted)]">
                    {copy.joinHelp}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-sm font-black text-[var(--ink)]">
                    <UserPlus className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                    {players.length}
                    <span className="text-[var(--muted)]">{copy.playersInRoom(MAX_PLAYERS)}</span>
                  </div>

                  <button
                    type="button"
                    disabled={players.length === 0}
                    onClick={() => {
                      enterFullscreen();
                      startGame();
                    }}
                    className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--tile-shadow)] disabled:opacity-50 sm:w-auto sm:min-w-56"
                  >
                    <Play className="h-5 w-5" aria-hidden="true" />
                    {copy.start(passaporteDeck ? passaporteDeck.questions.length : questionCount)}
                  </button>
                </div>

                <div className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 text-center">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{copy.scanToJoin}</h2>
                  {joinUrl ? (
                    <div className="mt-3 flex justify-center">
                      <div className="rounded-2xl bg-white p-3 shadow-sm">
                        <QRCodeSVG value={joinUrl} size={168} fgColor="#1c0b33" bgColor="#ffffff" />
                      </div>
                    </div>
                  ) : null}
                  <p className="mt-3 break-all text-[11px] font-semibold text-[var(--muted)]">{joinUrl}</p>
                </div>
              </div>

              <div className="mt-4 rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-5">
                <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{copy.lobby}</h2>
                {players.length === 0 ? (
                  <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                    {copy.waiting}
                  </p>
                ) : (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {players.map((player) => (
                      <li
                        key={player.id}
                        className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-sm font-black text-[var(--ink)]"
                      >
                        <Ghost className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                        {player.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </motion.section>
          )}

          {phase === 'question' && question && (
            <motion.section
              key={`question-${seq}`}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                    {copy.questionOf(seq + 1, run.length)}
                  </span>
                  <h1 className="mt-2 text-2xl font-black leading-snug text-[var(--ink)] sm:text-4xl">{question.text}</h1>
                  {showTranslation && question.textPt ? (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="mt-3 rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                        {copy.translationLabel}
                      </span>
                      <p className="mt-0.5 text-base font-semibold leading-snug text-[var(--ink)] sm:text-lg">
                        {question.textPt}
                      </p>
                    </motion.div>
                  ) : null}
                </div>

                <div className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 text-center">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{copy.timeLeft}</span>
                  <p className="hw-title mt-1 text-5xl font-black text-[var(--accent)] sm:text-6xl">
                    {Math.ceil(msLeft / 1000)}
                  </p>
                  <p className="mt-2 text-sm font-black text-[var(--ink)]">
                    {copy.answered(replies.length, players.length || '?')}
                  </p>
                </div>
              </div>

              <div className="mx-auto mt-4 grid max-w-3xl grid-cols-2 gap-3 sm:gap-4">
                {question.options.map((option, index) => {
                  const style = ANSWER_BUTTONS[index];
                  return (
                    <div
                      key={index}
                      className="flex aspect-square flex-col items-center justify-center gap-2 overflow-hidden rounded-3xl p-4 text-center text-white shadow-[var(--tile-shadow)] sm:gap-3"
                      style={{ backgroundColor: style.bg }}
                    >
                      <span className="text-5xl sm:text-6xl" aria-hidden="true">
                        {style.shape}
                      </span>
                      <span className="text-xl font-black leading-tight sm:text-2xl">{option}</span>
                    </div>
                  );
                })}
              </div>

              {showTranslation && question.textPt && question.optionsPt ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="mx-auto mt-4 max-w-3xl rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-4 py-3"
                >
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                    {copy.translationLabel}
                  </p>
                  <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
                    {question.optionsPt.map((option, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span
                          className="mt-0.5 text-sm leading-none"
                          style={{ color: ANSWER_BUTTONS[index]?.bg }}
                          aria-hidden="true"
                        >
                          {ANSWER_BUTTONS[index]?.shape}
                        </span>
                        <span className="min-w-0 text-sm font-semibold leading-snug text-[var(--ink)]">
                          {option}
                        </span>
                      </li>
                    ))}
                  </ol>
                </motion.div>
              ) : null}

              <p className="mt-4 text-center text-xs font-semibold text-[var(--muted)]">
                {copy.studentsRead}
              </p>
            </motion.section>
          )}

          {phase === 'reveal' && reveal && question && (
            <motion.section
              key={`reveal-${reveal.seq}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-6"
            >
              <div className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8">
                <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                  {copy.questionOf(reveal.seq + 1, run.length)}
                </span>
                <h1 className="mt-1 text-xl font-black text-[var(--ink)] sm:text-2xl">{question.text}</h1>
                {reveal.explanation ? (
                  <p className="mt-2 text-sm font-semibold text-[var(--muted)] sm:text-base">{reveal.explanation}</p>
                ) : null}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-5">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{copy.answers}</h2>
                  <ul className="mt-3 space-y-2">
                    {question.options.map((option, index) => {
                      const style = ANSWER_BUTTONS[index];
                      const total = reveal.counts[index] ?? 0;
                      const max = Math.max(...reveal.counts, 1);
                      const correct = index === reveal.correctIndex;
                      return (
                        <li key={index} className="flex items-center gap-3">
                          <span
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg font-black text-white"
                            style={{ backgroundColor: style.bg }}
                            aria-hidden="true"
                          >
                            {style.shape}
                          </span>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="truncate text-sm font-black text-[var(--ink)] sm:text-base">
                                {option}
                                {correct ? <Check className="ml-2 inline h-4 w-4 text-emerald-500" aria-hidden="true" /> : null}
                              </span>
                              <span className="text-xs font-black text-[var(--muted)]">{total}</span>
                            </div>
                            <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-[var(--surface-2)]">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${(total / max) * 100}%` }}
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: style.bg }}
                              />
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>

                <div className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-5">
                  <h2 className="text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">{copy.leaderboard}</h2>
                  <ol className="mt-3 space-y-1.5">
                    {reveal.leaderboard.slice(0, 8).map((row, position) => (
                      <li key={row.playerId} className="flex items-center gap-2 rounded-xl bg-[var(--surface-2)] px-3 py-2">
                        <span className="w-6 text-center text-xs font-black text-[var(--accent)]">{position + 1}</span>
                        <span className="min-w-0 flex-1 truncate text-sm font-black text-[var(--ink)]">{row.name}</span>
                        {row.gained > 0 ? (
                          <span className="text-[10px] font-black uppercase text-emerald-500">{formatPoints(row.gained)}</span>
                        ) : null}
                        <span className="text-sm font-black text-[var(--ink)]">{row.total.toLocaleString('pt-BR')}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              <p className="mt-4 text-center text-xs font-black uppercase tracking-wide text-[var(--muted)]">
                {autoAdvance
                  ? revealCountdown > 0
                    ? copy.nextAuto(revealCountdown)
                    : copy.advancing
                  : copy.autoOff}
              </p>
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  role="switch"
                  aria-checked={autoAdvance}
                  onClick={() => toggleAutoAdvance(!autoAdvance)}
                  className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-[11px] font-black uppercase tracking-wide transition-colors ${
                    autoAdvance
                      ? 'bg-[var(--accent)] text-white'
                      : 'border-2 border-[var(--line)] bg-[var(--surface)] text-[var(--muted)]'
                  }`}
                >
                  {copy.autoAdvanceToggle(autoAdvance)}
                </button>
              </div>

              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={nextQuestion}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[var(--tile-shadow)] sm:flex-none sm:min-w-56"
                >
                  {seq + 1 >= run.length ? (
                    <>
                      <RotateCcw className="h-5 w-5" aria-hidden="true" />
                      {copy.finishGame}
                    </>
                  ) : (
                    <>
                      <Play className="h-5 w-5" aria-hidden="true" />
                      {copy.nextQuestion}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
                    finishGame();
                  }}
                  className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-5 py-3 text-sm font-black uppercase tracking-wide text-[var(--muted)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  {copy.endGame}
                </button>
              </div>
            </motion.section>
          )}

          {phase === 'over' && (
            <motion.section
              key="over"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="mt-6 rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8"
            >
              <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-[var(--accent)] bg-[var(--surface-2)] text-[var(--accent)]">
                <Trophy className="h-8 w-8" aria-hidden="true" />
              </span>
              <h1 className="mt-4 text-center text-3xl font-black uppercase tracking-tight text-[var(--ink)] sm:text-4xl">
                {copy.gameOver}
              </h1>

              <div className="mx-auto mt-6 grid max-w-md grid-cols-3 items-end gap-2 sm:gap-3">
                {[
                  { place: 3, row: finalRows[2] },
                  { place: 2, row: finalRows[1] },
                  { place: 1, row: finalRows[0] },
                ].map((slot, index) => {
                  const revealed = podiumStep >= index + 1;
                  const rankHeight = slot.place === 1 ? 'min-h-48 sm:min-h-56' : slot.place === 2 ? 'min-h-40 sm:min-h-44' : 'min-h-32 sm:min-h-36';
                  return (
                    <motion.div
                      key={slot.place}
                      initial={{ opacity: 0, y: 24, scale: 0.9 }}
                      animate={revealed ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0.35, y: 24, scale: 0.9 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className={`flex flex-col items-center justify-end gap-1 rounded-3xl border-4 px-2 py-3 sm:py-4 ${
                        slot.place === 1
                          ? 'border-[var(--accent)] bg-[var(--surface-2)]'
                          : 'border-[var(--line)] bg-[var(--surface-2)]'
                      } ${rankHeight}`}
                      aria-hidden={!revealed}
                    >
                      <span
                        className={`text-3xl font-black sm:text-4xl ${
                          slot.place === 1 ? 'text-[var(--accent)]' : 'text-[var(--ink)]'
                        }`}
                      >
                        {slot.place}
                      </span>
                      {revealed ? (
                        <>
                          <span className="max-w-full truncate text-center text-sm font-black text-[var(--ink)] sm:text-base">
                            {slot.row?.name ?? '—'}
                          </span>
                          {slot.row ? (
                            <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
                              {slot.row.total.toLocaleString(uiLanguage === 'pt' ? 'pt-BR' : 'en-US')} {copy.points}
                            </span>
                          ) : null}
                        </>
                      ) : null}
                    </motion.div>
                  );
                })}
              </div>

              {finalRows.length > 3 ? (
                <ol className="mx-auto mt-6 max-w-md space-y-2">
                  {finalRows.slice(3, 10).map((row, index) => (
                    <li
                      key={row.playerId}
                      className="flex items-center gap-3 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-2.5"
                    >
                      <span className="w-7 text-center text-sm font-black text-[var(--accent)]">{index + 4}</span>
                      <span className="min-w-0 flex-1 truncate text-base font-black text-[var(--ink)]">{row.name}</span>
                      <span className="text-base font-black text-[var(--ink)]">{row.total.toLocaleString('pt-BR')}</span>
                    </li>
                  ))}
                </ol>
              ) : null}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    enterFullscreen();
                    setPhase('lobby');
                    setReveal({ seq: -1, correctIndex: -1, counts: [0, 0, 0, 0], explanation: '', leaderboard: [] });
                  }}
                  className="flex items-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3 text-sm font-black uppercase tracking-wide text-[var(--cta-text)]"
                >
                  <RotateCcw className="h-4 w-4" aria-hidden="true" />
                  {copy.playAgainSameRoom}
                </button>
                <a
                  href="/"
                  onClick={() => clearSavedSession()}
                  className="flex items-center gap-2 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-5 py-3 text-sm font-black uppercase tracking-wide text-[var(--muted)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  {copy.closeRoom}
                </a>
              </div>
            </motion.section>
          )}
      </div>
    </main>
  );
}
