'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import clsx from 'clsx';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Dices,
  ExternalLink,
  Gamepad2,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  MonitorPlay,
  Pencil,
  Plus,
  Presentation,
  Radio,
  Trash2,
  Trophy,
  Users,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { FLASH_DEFAULT_SECONDS, SlideStage } from '@/components/aula/SlideView';
import { QUIZ_LESSON_ID, buildQuizSlides } from '@/components/aula/quizSlides';
import Greeting from '@/components/professor/Greeting';
import CursorToggle from '@/components/professor/CursorToggle';
import ProfessorNav from '@/components/professor/ProfessorNav';
import WeekAgenda from '@/components/professor/WeekAgenda';
import NextClassCard from '@/components/professor/NextClassCard';
import TodayClasses from '@/components/professor/TodayClasses';
import { fetchAgendaData } from '@/lib/agenda/data';
import type { AgendaData } from '@/lib/agenda/types';
import { findNext, findOngoing, occurrencesForDate } from '@/lib/agenda/dashboard';
import { flattenBeats, type Lesson, type Slide } from '@/lib/passaporte-lessons';
import { fetchLessons } from '@/lib/aula/lessons';
import { PASSAPORTE_DECKS } from '@/lib/passaporte-decks';
import { CLASSIC_CATEGORIES } from '@/lib/classic-questions';
import { categoryCopy } from '@/lib/i18n/game-copy';
import { getDeck } from '@/lib/game';
import { CLASSIC_ALL_CATEGORIES, getClassicDeck } from '@/lib/classic-questions';
import type { ClassicCategoryId, DifficultyId } from '@/lib/types';
import type { WheelGameState } from '@/lib/aula/games';
import WheelControl from '@/components/game/WheelControl';
import { getLiveDeck, prepareQuestion, randomRoomCode, sanitizeRoomCode } from '@/lib/live/room';
import type { PassaGameState, PassaQuestion, D20GameState } from '@/lib/aula/games';
import PassaControl from '@/components/game/PassaControl';
import D20Control from '@/components/game/D20Control';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';
import {
  AULA_GATE_STORAGE,
  AULA_SESSION_STORAGE,
  AULA_WELCOME_FALLBACK,
  PASSAPORTE_GATE_CODE,
  createAulaChannel,
  type AulaChannel,
  type AulaCompMessage,
  type AulaCompScore,
  type AulaConnectionStatus,
  type AulaD20Message,
  type AulaMessage,
} from '@/lib/aula/sync';

type TeacherMode = 'lesson' | 'quiz';
type QuizSeconds = 15 | 20 | 30;
/** Pre-class screen (welcome/QR) versus the live script. */
type AulaPhase = 'welcome' | 'live';

const QUIZ_SECONDS: QuizSeconds[] = [15, 20, 30];

/** Generic placeholder so the projector can still render before the first beat. */
const WAITING_SLIDE: Slide = { kind: 'cover', title: 'Aguardando o professor…' };

function resolveSlide(lesson: Lesson, lessonId: string, index: number): Slide | null {
  if (lessonId === QUIZ_LESSON_ID) {
    return buildQuizSlides(lesson.deckId)[index] ?? null;
  }
  return flattenBeats(lesson)[index]?.slide ?? null;
}

function todayIso(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

function formatLessonDate(iso: string): string {
  const parts = iso.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function addDaysIso(iso: string, days: number): string {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return iso;
  const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
  date.setDate(date.getDate() + days);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/** "quinta-feira, 12 de novembro" (weekday + day + month). */
function formatLessonDay(iso: string): string {
  const parts = iso.split('-').map(Number);
  if (parts.length !== 3 || parts.some((value) => !Number.isFinite(value))) return iso;
  const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
  const label = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** "Hoje"/"Amanhã" badge for a lesson day. */
function lessonDayBadge(iso: string, today: string): string {
  if (!iso) return 'Sem data';
  if (!today) return '';
  if (iso === today) return 'Hoje';
  if (iso === addDaysIso(today, 1)) return 'Amanhã';
  return '';
}

/** Minutes since midnight extracted from "C2-08 · Quinta 15:30–18:00". */
function lessonStartMinutes(turma: string): number {
  const match = turma.match(/(\d{1,2}):(\d{2})/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** True when `now` is inside the lesson (with a 5-minute grace on both sides). */
function isLessonNow(lesson: Lesson, now: Date): boolean {
  const startMinutes = lessonStartMinutes(lesson.turma);
  if (!Number.isFinite(startMinutes) || startMinutes >= 24 * 60) return false;

  const start = new Date(now);
  start.setHours(Math.floor(startMinutes / 60), startMinutes % 60, 0, 0);
  const end = new Date(start.getTime() + lesson.totalMin * 60_000);
  const grace = 5 * 60_000;

  return now.getTime() >= start.getTime() - grace && now.getTime() <= end.getTime() + grace;
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement('textarea');
      field.value = text;
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      field.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

function ConnectionPill({
  status,
  tvOnline,
}: {
  status: AulaConnectionStatus;
  tvOnline: boolean;
}) {
  const meta =
    status === 'offline'
      ? { dot: 'bg-amber-500', label: 'Realtime off' }
      : status === 'error'
        ? { dot: 'bg-red-400 animate-pulse', label: 'Reconectando…' }
        : status === 'closed'
          ? { dot: 'bg-slate-500', label: 'Aguardando telão' }
          : tvOnline
            ? { dot: 'bg-emerald-400', label: 'Telão conectado' }
            : { dot: 'bg-slate-500', label: 'Aguardando telão' };

  return (
    <span className="flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

type WarmupKind = 'none' | 'live' | 'd20' | 'comp' | 'wheel' | 'passa';

const WARMUP_ITEMS: {
  id: Exclude<WarmupKind, 'none'>;
  label: string;
  description: string;
  Icon: typeof Radio;
}[] = [
  { id: 'live', label: 'Live', description: 'Quiz ao vivo', Icon: Radio },
  { id: 'comp', label: 'Competição', description: 'Torneio da turma', Icon: Trophy },
  { id: 'd20', label: 'D20', description: 'Dado de perguntas', Icon: Dices },
  { id: 'wheel', label: 'Roleta', description: 'Roleta na TV', Icon: Dices },
  { id: 'passa', label: 'Passa Repassa', description: 'Times na TV', Icon: Trophy },
];

/** Live warm-up theme labels (the id maps to the classic categories). */
const LIVE_THEMES: { id: ClassicCategoryId | 'all'; label: string }[] = [
  { id: 'all', label: 'Todos' },
  ...CLASSIC_CATEGORIES.map((category) => ({
    id: category.id,
    label: categoryCopy(category.id, 'pt').label,
  })),
];

const LIVE_COUNTS: (8 | 12 | 16)[] = [8, 12, 16];
const COMP_ROUNDS: number[] = [1, 2, 3, 5];

/**
 * Warm-up shortcuts for the teacher. Each one opens a configuration modal and
 * runs on the projector (`/tela`), so the student screen never leaves the aula.
 */
function WarmupBar({
  active,
  onOpen,
}: {
  active: WarmupKind;
  onOpen: (kind: Exclude<WarmupKind, 'none'>) => void;
}) {
  return (
    <section
      aria-label="Warm-up rápido"
      className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-3"
    >
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
          Warm-up rápido
        </p>
        <p className="text-[11px] font-semibold text-[var(--muted)]">
          Configura aqui e roda no telão — a aula continua aberta.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {WARMUP_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onOpen(item.id)}
              title={`${item.label} — ${item.description}`}
              aria-pressed={isActive}
              className={
                isActive
                  ? 'flex items-center gap-2 rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--accent)]'
                  : 'flex items-center gap-2 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]'
              }
            >
              <item.Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
              {isActive ? <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" /> : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function AulaPage() {
  const [mounted, setMounted] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [gateInput, setGateInput] = useState('');
  const [gateError, setGateError] = useState('');
  const [today, setToday] = useState('');

  const [lessons, setLessons] = useState<Lesson[] | null>(null);
  const [lessonsLoading, setLessonsLoading] = useState(false);
  const [lessonsError, setLessonsError] = useState(false);
  const [lessonsNonce, setLessonsNonce] = useState(0);

  /* Group the lesson bank by day: upcoming (today first, ascending) and past
     (most recent first). This keeps the picker navigable as the bank grows. */
  const lessonGroups = useMemo(() => {
    const sorted = [...(lessons ?? [])].sort(
      (a, b) =>
        (a.date || '').localeCompare(b.date || '') ||
        lessonStartMinutes(a.turma) - lessonStartMinutes(b.turma) ||
        a.turma.localeCompare(b.turma)
    );
    const byDay = new Map<string, Lesson[]>();
    for (const lesson of sorted) {
      const key = lesson.date || '';
      const list = byDay.get(key);
      if (list) list.push(lesson);
      else byDay.set(key, [lesson]);
    }
    const groups = Array.from(byDay, ([date, items]) => ({ date, items }));
    const upcoming = groups.filter((group) => !today || group.date >= today);
    const past = groups
      .filter((group) => today !== '' && group.date < today)
      .sort((a, b) => b.date.localeCompare(a.date));
    return { upcoming, past };
  }, [lessons, today]);

  /* The greeting says "Boa aula" when a lesson is happening now. */
  const [nowTick, setNowTick] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => {
      setNowTick(Date.now());
      setToday(todayIso());
    };
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, []);
  const now = useMemo(() => new Date(nowTick), [nowTick]);
  const currentLesson = useMemo(() => {
    if (!today || !lessons || lessons.length === 0) return null;
    return lessons.find((lesson) => lesson.date === today && isLessonNow(lesson, now)) ?? null;
  }, [lessons, today, now]);

  /* Agenda/occurrences (including unplanned slots) for the dashboard. */
  const [agenda, setAgenda] = useState<AgendaData | null>(null);
  const [agendaLoading, setAgendaLoading] = useState(false);
  const [agendaNotice, setAgendaNotice] = useState('');

  useEffect(() => {
    if (!authed) return;
    let active = true;
    setAgendaLoading(true);
    fetchAgendaData()
      .then((data) => {
        if (active) setAgenda(data);
      })
      .finally(() => {
        if (active) setAgendaLoading(false);
      });
    return () => {
      active = false;
    };
  }, [authed, lessonsNonce]);

  const ongoing = useMemo(
    () => findOngoing(agenda?.occurrences ?? [], now),
    [agenda, now]
  );
  const next = useMemo(() => findNext(agenda?.occurrences ?? [], now), [agenda, now]);
  const featured = ongoing ?? next;
  const todayOccurrences = useMemo(
    () => occurrencesForDate(agenda?.occurrences ?? [], today),
    [agenda, today]
  );
  const featuredClass = featured?.class_id
    ? agenda?.classes.find((row) => row.id === featured.class_id)
    : undefined;
  const featuredLesson = featured
    ? (lessons ?? []).find(
        (lesson) => (lesson.occurrenceId ?? lesson.id) === featured.id
      )
    : undefined;
  const featuredTitle =
    featuredLesson?.title ??
    (featured?.content_id
      ? agenda?.contents.find((row) => row.id === featured.content_id)?.title
      : null) ??
    'Aula a planejar';

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const openedFromQueryRef = useRef(false);
  const [sessionCode, setSessionCode] = useState('');
  const [tvUrl, setTvUrl] = useState('');
  const [beatIndex, setBeatIndex] = useState(0);
  const [mode, setMode] = useState<TeacherMode>('lesson');
  const [quizIndex, setQuizIndex] = useState(0);
  const [phase, setPhase] = useState<AulaPhase>('welcome');
  /** Scene image per beat index — kept while navigating the script. */
  const [imageUrls, setImageUrls] = useState<Record<number, string>>({});
  const [imageInput, setImageInput] = useState('');

  const [connection, setConnection] = useState<AulaConnectionStatus>('idle');
  /** True only while a projector (`role: 'tv'`) is present on the channel. */
  const [tvOnline, setTvOnline] = useState(false);
  const [copied, setCopied] = useState<'code' | 'url' | null>(null);
  const [liveQuizCode, setLiveQuizCode] = useState<string | null>(null);
  const [hostUrl, setHostUrl] = useState('');

  const [quizModalOpen, setQuizModalOpen] = useState(false);
  const [seconds, setSeconds] = useState<QuizSeconds>(20);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [usePhones, setUsePhones] = useState(true);

  /* Warm-ups: configured here, rendered by /tela. */
  const [warmup, setWarmup] = useState<WarmupKind>('none');
  const [warmupModal, setWarmupModal] = useState<WarmupKind>('none');
  const [liveCount, setLiveCount] = useState<8 | 12 | 16>(12);
  const [liveSeconds, setLiveSeconds] = useState<QuizSeconds>(20);
  const [liveTheme, setLiveTheme] = useState<ClassicCategoryId | 'all'>('all');
  const [d20, setD20] = useState<AulaD20Message | null>(null);
  const [d20Revealed, setD20Revealed] = useState(false);
  const [compNames, setCompNames] = useState<string[]>([]);
  const [compNameInput, setCompNameInput] = useState('');
  const [compRounds, setCompRounds] = useState(3);
  const [compMessage, setCompMessage] = useState<AulaCompMessage | null>(null);
  const [compRanking, setCompRanking] = useState<AulaCompScore[] | null>(null);
  const [wheelGame, setWheelGame] = useState<WheelGameState | null>(null);
  const [wheelCategories, setWheelCategories] = useState<ClassicCategoryId[]>(
    CLASSIC_ALL_CATEGORIES
  );
  const [wheelDifficulty, setWheelDifficulty] = useState<DifficultyId>('medium');
  const [wheelRoundsInput, setWheelRoundsInput] = useState('');
  const [wheelSpinRequest, setWheelSpinRequest] = useState(0);
  const [passaGame, setPassaGame] = useState<PassaGameState | null>(null);
  const [passaTeam1, setPassaTeam1] = useState('Time 1');
  const [passaTeam2, setPassaTeam2] = useState('Time 2');
  const [passaTarget, setPassaTarget] = useState<5 | 10 | 15>(5);
  const [passaDifficulty, setPassaDifficulty] = useState<DifficultyId>('medium');
  const [d20Game, setD20Game] = useState<D20GameState | null>(null);

  const channelRef = useRef<AulaChannel | null>(null);
  const sessionRestoredRef = useRef(false);
  const activeLessonRef = useRef<Lesson | null>(null);
  const beatIndexRef = useRef(0);
  const quizIndexRef = useRef(0);
  const modeRef = useRef<TeacherMode>('lesson');
  const phaseRef = useRef<AulaPhase>('welcome');
  const imageUrlsRef = useRef<Record<number, string>>({});
  const liveQuizRef = useRef<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  /* Warm-up refs, read by the channel sync without waiting for a re-render. */
  const warmupRef = useRef<WarmupKind>('none');
  const d20Ref = useRef<AulaD20Message | null>(null);
  const d20RevealedRef = useRef(false);
  const compNamesRef = useRef<string[]>([]);
  const compRoundsRef = useRef(3);
  const compMessageRef = useRef<AulaCompMessage | null>(null);
  const compRankingRef = useRef<AulaCompScore[] | null>(null);
  const compScoresRef = useRef<Record<string, number>>({});
  const compTurnRef = useRef(0);
  const wheelGameRef = useRef<WheelGameState | null>(null);
  const wheelUsedRef = useRef<Set<string>>(new Set());
  const wheelSpinTimerRef = useRef<number | null>(null);
  const passaGameRef = useRef<PassaGameState | null>(null);
  const passaUsedRef = useRef<Set<string>>(new Set());
  const d20GameRef = useRef<D20GameState | null>(null);
  const teacherPresenceIdRef = useRef('');

  useEffect(() => {
    activeLessonRef.current = activeLesson;
    beatIndexRef.current = beatIndex;
    quizIndexRef.current = quizIndex;
    modeRef.current = mode;
    phaseRef.current = phase;
    imageUrlsRef.current = imageUrls;
    liveQuizRef.current = liveQuizCode;
    warmupRef.current = warmup;
    d20Ref.current = d20;
    d20RevealedRef.current = d20Revealed;
    compNamesRef.current = compNames;
    compRoundsRef.current = compRounds;
    compMessageRef.current = compMessage;
    compRankingRef.current = compRanking;
    wheelGameRef.current = wheelGame;
    passaGameRef.current = passaGame;
    d20GameRef.current = d20Game;
  }, [
    activeLesson,
    beatIndex,
    compMessage,
    compNames,
    compRanking,
    compRounds,
    d20,
    d20Revealed,
    d20Game,
    imageUrls,
    liveQuizCode,
    mode,
    phase,
    quizIndex,
    warmup,
    wheelGame,
    passaGame,
  ]);

  /* ------------------------------------------------------------------ */
  /* Boot: gate + today's date                                           */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    setMounted(true);
    setToday(todayIso());
    setAuthed(readStorage(AULA_GATE_STORAGE) === '1');
  }, []);

  /* ------------------------------------------------------------------ */
  /* Lessons: loaded from Supabase at runtime (never bundled)            */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!authed) return;

    let active = true;
    setLessonsLoading(true);
    setLessonsError(false);

    fetchLessons()
      .then((result) => {
        if (!active) return;
        setLessons(result);
        setLessonsError(result.length === 0);
      })
      .catch(() => {
        if (!active) return;
        setLessons([]);
        setLessonsError(true);
      })
      .finally(() => {
        if (active) setLessonsLoading(false);
      });

    return () => {
      active = false;
    };
  }, [authed, lessonsNonce]);

  /* Session recovery waits for the lessons, since it needs the content. */
  useEffect(() => {
    if (!authed || !lessons || lessons.length === 0 || sessionRestoredRef.current) return;
    sessionRestoredRef.current = true;

    try {
      const raw = readStorage(AULA_SESSION_STORAGE);
      if (!raw) return;
      const parsed = JSON.parse(raw) as {
        lessonId?: unknown;
        code?: unknown;
        index?: unknown;
        quiz?: unknown;
        warmup?: unknown;
        hostUrl?: unknown;
        phase?: unknown;
        images?: unknown;
        wheel?: unknown;
        passa?: unknown;
        d20?: unknown;
        comp?: unknown;
        compRanking?: unknown;
      };
      if (typeof parsed.lessonId !== 'string' || typeof parsed.code !== 'string') return;

      const lesson = lessons.find((candidate) => candidate.id === parsed.lessonId);
      const code = sanitizeRoomCode(parsed.code);
      if (!lesson || !code) return;

      const beats = flattenBeats(lesson);
      const savedIndex =
        typeof parsed.index === 'number' && Number.isFinite(parsed.index)
          ? Math.min(Math.max(Math.floor(parsed.index), 0), Math.max(beats.length - 1, 0))
          : 0;
      const savedQuiz =
        typeof parsed.quiz === 'string' ? sanitizeRoomCode(parsed.quiz) : null;
      const savedWheel =
        parsed.wheel && typeof parsed.wheel === 'object'
          ? (parsed.wheel as WheelGameState)
          : null;
      const savedPassa =
        parsed.passa && typeof parsed.passa === 'object'
          ? (parsed.passa as PassaGameState)
          : null;
      const savedD20 =
        parsed.d20 && typeof parsed.d20 === 'object'
          ? (parsed.d20 as D20GameState)
          : null;
      const savedComp =
        parsed.comp && typeof parsed.comp === 'object'
          ? (parsed.comp as AulaCompMessage)
          : null;
      const savedCompRanking = Array.isArray(parsed.compRanking)
        ? (parsed.compRanking as AulaCompScore[])
        : null;
      /* Live, the wheel, Passa, D20 and Competition restore from storage. */
      const savedWarmup: WarmupKind =
        parsed.warmup === 'comp' && savedComp
          ? 'comp'
          : parsed.warmup === 'd20' && savedD20
            ? 'd20'
            : parsed.warmup === 'passa' && savedPassa
              ? 'passa'
              : parsed.warmup === 'wheel' && savedWheel
                ? 'wheel'
                : parsed.warmup === 'live' && savedQuiz
                  ? 'live'
                  : 'none';
      const savedHostUrl = typeof parsed.hostUrl === 'string' ? parsed.hostUrl : '';
      /* Sessions saved before the welcome screen existed default to live. */
      const savedPhase: AulaPhase = parsed.phase === 'welcome' ? 'welcome' : 'live';
      const savedImages: Record<number, string> = {};
      if (parsed.images && typeof parsed.images === 'object') {
        for (const [key, value] of Object.entries(parsed.images)) {
          const position = Number(key);
          if (
            Number.isInteger(position) &&
            position >= 0 &&
            typeof value === 'string' &&
            value.trim() !== ''
          ) {
            savedImages[position] = value;
          }
        }
      }

      setActiveLesson(lesson);
      setSessionCode(code);
      setBeatIndex(savedIndex);
      setPhase(savedPhase);
      setImageUrls(savedImages);
      setImageInput(savedImages[savedIndex] ?? '');
      setTvUrl(`${window.location.origin}/tela?c=${code}`);
      if (savedWarmup === 'live') {
        setWarmup('live');
        warmupRef.current = 'live';
      }
      if (savedWarmup === 'wheel' && savedWheel) {
        const restored =
          savedWheel.phase === 'spinning'
            ? { ...savedWheel, phase: 'idle' as const }
            : savedWheel;
        wheelGameRef.current = restored;
        setWheelGame(restored);
        setWarmup('wheel');
        warmupRef.current = 'wheel';
      }
      if (savedWarmup === 'passa' && savedPassa) {
        passaGameRef.current = savedPassa;
        setPassaGame(savedPassa);
        setWarmup('passa');
        warmupRef.current = 'passa';
      }
      if (savedWarmup === 'd20' && savedD20) {
        d20GameRef.current = savedD20;
        setD20Game(savedD20);
        setWarmup('d20');
        warmupRef.current = 'd20';
      }
      if (savedWarmup === 'comp' && savedComp) {
        const names = savedComp.scores.map((row) => row.name);
        const scores = Object.fromEntries(savedComp.scores.map((row) => [row.name, row.score]));
        compNamesRef.current = names;
        compRoundsRef.current = savedComp.totalRounds ?? compRoundsRef.current;
        compScoresRef.current = scores;
        compTurnRef.current =
          ((savedComp.round ?? 1) - 1) * Math.max(names.length, 1) +
          Math.max(names.indexOf(savedComp.student), 0);
        compMessageRef.current = savedComp;
        compRankingRef.current = savedCompRanking;
        setCompNames(names);
        setCompRounds(savedComp.totalRounds ?? compRoundsRef.current);
        setCompMessage(savedComp);
        setCompRanking(savedCompRanking);
        setWarmup('comp');
        warmupRef.current = 'comp';
      }
      if (savedQuiz) {
        setLiveQuizCode(savedQuiz);
        setHostUrl(
          savedHostUrl ||
            `${window.location.origin}/host?deck=${encodeURIComponent(lesson.deckId)}&room=${savedQuiz}&lang=pt&start=1`
        );
      }

      activeLessonRef.current = lesson;
      beatIndexRef.current = savedIndex;
      quizIndexRef.current = 0;
      modeRef.current = 'lesson';
      phaseRef.current = savedPhase;
      imageUrlsRef.current = savedImages;
      liveQuizRef.current = savedQuiz;
    } catch {
      // Corrupted storage must never block the teacher.
    }
  }, [authed, lessons]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    };
  }, []);

  /* ------------------------------------------------------------------ */
  /* Session persistence + channel                                       */
  /* ------------------------------------------------------------------ */

  useEffect(() => {
    if (!activeLesson || !sessionCode) return;
    writeStorage(
      AULA_SESSION_STORAGE,
      JSON.stringify({
        lessonId: activeLesson.id,
        code: sessionCode,
        index: beatIndex,
        quiz: liveQuizCode,
        warmup,
        hostUrl,
        phase,
        images: imageUrls,
        wheel: wheelGame,
        passa: passaGame,
        d20: d20Game,
        comp: compMessage,
        compRanking,
      })
    );
  }, [
    activeLesson,
    sessionCode,
    beatIndex,
    liveQuizCode,
    warmup,
    hostUrl,
    phase,
    imageUrls,
    wheelGame,
    passaGame,
    d20Game,
    compMessage,
    compRanking,
  ]);

  useEffect(() => {
    if (!activeLesson || !sessionCode) return;

    let active = true;

    /**
     * Sends the current position to the TV. During welcome only the welcome
     * message goes out; live sends `state` (+ `slide`) so a late TV catches up.
     */
    const syncTv = () => {
      const lesson = activeLessonRef.current;
      if (!lesson) return;

      /* A warm-up/game owns the projector even during the welcome screen: a
         TV that just reconnected must land on the game, not on welcome. */
      if (warmupRef.current === 'passa') {
        const game = passaGameRef.current;
        if (game) {
          channelRef.current?.send({
            type: 'game',
            game: 'passa',
            seq: game.seq,
            state: game,
          });
        }
        return;
      }
      if (warmupRef.current === 'wheel') {
        const game = wheelGameRef.current;
        if (game) {
          channelRef.current?.send({
            type: 'game',
            game: 'wheel',
            seq: game.seq,
            state: game,
          });
        }
        return;
      }
      if (warmupRef.current === 'd20') {
        const game = d20GameRef.current;
        if (game) {
          channelRef.current?.send({
            type: 'game',
            game: 'd20',
            seq: game.seq,
            state: game,
          });
        }
        return;
      }
      if (warmupRef.current === 'comp') {
        if (compMessageRef.current) channelRef.current?.send(compMessageRef.current);
        if (compRankingRef.current) {
          channelRef.current?.send({ type: 'compEnd', ranking: compRankingRef.current });
        }
        return;
      }

      if (phaseRef.current === 'welcome') {
        channelRef.current?.send({ type: 'welcome', welcome: lesson.welcome });
        return;
      }

      const inQuiz = modeRef.current === 'quiz';
      const lessonId = inQuiz ? QUIZ_LESSON_ID : lesson.id;
      const index = inQuiz ? quizIndexRef.current : beatIndexRef.current;
      const liveQuiz = liveQuizRef.current;
      const slide = resolveSlide(lesson, lessonId, index) ?? WAITING_SLIDE;
      const imageUrl = inQuiz ? undefined : imageUrlsRef.current[index];

      channelRef.current?.send({
        type: 'state',
        lessonId,
        index,
        slide,
        imageUrl,
        quiz: liveQuiz,
      });
      // During a phone quiz the projector must stay on the Live room; a
      // lesson slide here would pull it out of the quiz screen.
      if (!liveQuiz) {
        channelRef.current?.send({ type: 'slide', lessonId, index, slide, imageUrl });
      }
    };

    const handle = createAulaChannel(sessionCode, {
      onMessage: (message: AulaMessage) => {
        if (!active) return;
        if (message.type === 'hello') {
          syncTv();
          return;
        }
        if (message.type === 'command' && message.game === 'wheel' && message.action === 'spin') {
          setWheelSpinRequest((value) => value + 1);
        }
      },
      onStatus: (status) => {
        if (!active) return;
        setConnection(status);
        if (status === 'error' || status === 'closed' || status === 'offline') {
          setTvOnline(false);
        }
      },
      onSubscribed: () => {
        if (!active) return;
        if (!teacherPresenceIdRef.current) {
          teacherPresenceIdRef.current = `teacher-${Math.random().toString(36).slice(2, 10)}`;
        }
        /* Presence is how `/tela` knows the teacher is still in the room. */
        channelRef.current?.track({ role: 'teacher', id: teacherPresenceIdRef.current });
        syncTv();
      },
      onPresence: (members) => {
        if (!active) return;
        setTvOnline(members.some((member) => member.role === 'tv'));
      },
    });

    if (!handle) {
      setConnection('offline');
      setTvOnline(false);
      return;
    }

    channelRef.current = handle;
    return () => {
      active = false;
      handle.remove();
      if (channelRef.current === handle) channelRef.current = null;
    };
  }, [activeLesson, sessionCode]);

  /* ------------------------------------------------------------------ */
  /* Derived slides                                                      */
  /* ------------------------------------------------------------------ */

  const beats = useMemo(() => (activeLesson ? flattenBeats(activeLesson) : []), [activeLesson]);
  const quizSlides = useMemo(
    () => (activeLesson ? buildQuizSlides(activeLesson.deckId) : []),
    [activeLesson]
  );

  const beat = beats[beatIndex];
  const lessonSlide = beat?.slide;
  const segment = activeLesson?.segments.find((item) => item.id === beat?.segmentId);
  const quizSlide = quizSlides[quizIndex];
  const currentSlide = mode === 'quiz' ? quizSlide : beat?.slide;
  const totalItems = mode === 'quiz' ? quizSlides.length : beats.length;
  const currentIndex = mode === 'quiz' ? quizIndex : beatIndex;
  const deck = activeLesson ? PASSAPORTE_DECKS[activeLesson.deckId] : undefined;

  /**
   * Link-only image control: the "cena" segment already exposes it, and a
   * `flash` slide needs exactly the same input (URL per beat, no upload).
   */
  const isFlashSlide = lessonSlide?.kind === 'flash';
  const flashSlideSeconds =
    lessonSlide?.kind === 'flash'
      ? Math.min(Math.max(Math.round(lessonSlide.seconds ?? FLASH_DEFAULT_SECONDS), 1), 120)
      : FLASH_DEFAULT_SECONDS;
  const showImageControl =
    mode === 'lesson' && (segment?.id === 'cena' || isFlashSlide === true);

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */

  const broadcast = useCallback((message: AulaMessage) => {
    channelRef.current?.send(message);
  }, []);

  /* Heartbeat: the projector shows "professor desconectado" only after 15 s
     without a ping/presence, and keeps the last slide on screen. */
  useEffect(() => {
    if (!activeLesson || !sessionCode) return;
    const ping = () => broadcast({ type: 'ping', at: Date.now() });
    ping();
    const timer = window.setInterval(ping, 5000);
    return () => window.clearInterval(timer);
  }, [activeLesson, sessionCode, broadcast]);

  /** Re-sends the teacher's current slide (lesson beat or quiz presentation). */
  const sendCurrentSlide = useCallback(() => {
    const lesson = activeLessonRef.current;
    if (!lesson) return;

    if (phaseRef.current === 'welcome') {
      broadcast({ type: 'welcome', welcome: lesson.welcome });
      return;
    }

    const inQuiz = modeRef.current === 'quiz';
    const lessonId = inQuiz ? QUIZ_LESSON_ID : lesson.id;
    const index = inQuiz ? quizIndexRef.current : beatIndexRef.current;
    const slide = resolveSlide(lesson, lessonId, index) ?? WAITING_SLIDE;
    const imageUrl = inQuiz ? undefined : imageUrlsRef.current[index];
    broadcast({ type: 'slide', lessonId, index, slide, imageUrl });
  }, [broadcast]);

  /** Clears every warm-up overlay, locally and on the projector. */
  const resetWarmupState = useCallback(() => {
    warmupRef.current = 'none';
    setWarmup('none');
    d20Ref.current = null;
    setD20(null);
    d20RevealedRef.current = false;
    setD20Revealed(false);
    compMessageRef.current = null;
    setCompMessage(null);
    compRankingRef.current = null;
    setCompRanking(null);
    if (wheelSpinTimerRef.current) {
      window.clearTimeout(wheelSpinTimerRef.current);
      wheelSpinTimerRef.current = null;
    }
    wheelGameRef.current = null;
    setWheelGame(null);
    wheelUsedRef.current.clear();
    passaGameRef.current = null;
    setPassaGame(null);
    passaUsedRef.current.clear();
    d20GameRef.current = null;
    setD20Game(null);
    liveQuizRef.current = null;
    setLiveQuizCode(null);
    setHostUrl('');
    setWarmupModal('none');
  }, []);

  const goToBeat = useCallback(
    (index: number) => {
      const lesson = activeLessonRef.current;
      if (!lesson) return;
      const allBeats = flattenBeats(lesson);
      if (allBeats.length === 0) return;

      const next = Math.min(Math.max(Math.floor(index), 0), allBeats.length - 1);
      const slide = allBeats[next]?.slide;
      if (!slide) return;

      const imageUrl = imageUrlsRef.current[next];
      const leavingOverlay = warmupRef.current === 'd20' || warmupRef.current === 'comp';
      modeRef.current = 'lesson';
      liveQuizRef.current = null;
      beatIndexRef.current = next;
      setMode('lesson');
      setLiveQuizCode(null);
      setHostUrl('');
      setBeatIndex(next);
      setImageInput(imageUrlsRef.current[next] ?? '');
      resetWarmupState();
      if (leavingOverlay) broadcast({ type: 'warmupEnd' });
      broadcast({ type: 'quizEnd' });
      broadcast({ type: 'slide', lessonId: lesson.id, index: next, slide, imageUrl });
    },
    [broadcast, resetWarmupState]
  );

  const goToQuizSlide = useCallback(
    (index: number) => {
      const lesson = activeLessonRef.current;
      if (!lesson) return;
      const slides = buildQuizSlides(lesson.deckId);
      if (slides.length === 0) return;

      const next = Math.min(Math.max(Math.floor(index), 0), slides.length - 1);
      const slide = slides[next];
      if (!slide) return;

      modeRef.current = 'quiz';
      quizIndexRef.current = next;
      setMode('quiz');
      setQuizIndex(next);
      if (warmupRef.current === 'd20' || warmupRef.current === 'comp') {
        broadcast({ type: 'warmupEnd' });
      }
      resetWarmupState();
      broadcast({ type: 'slide', lessonId: QUIZ_LESSON_ID, index: next, slide });
    },
    [broadcast, resetWarmupState]
  );

  const goPrev = useCallback(() => {
    if (modeRef.current === 'quiz') {
      if (quizIndexRef.current > 0) goToQuizSlide(quizIndexRef.current - 1);
      return;
    }
    if (beatIndexRef.current > 0) goToBeat(beatIndexRef.current - 1);
  }, [goToBeat, goToQuizSlide]);

  const goNext = useCallback(() => {
    const lesson = activeLessonRef.current;
    if (!lesson) return;

    if (modeRef.current === 'quiz') {
      const total = buildQuizSlides(lesson.deckId).length;
      if (quizIndexRef.current < total - 1) goToQuizSlide(quizIndexRef.current + 1);
      return;
    }

    const total = flattenBeats(lesson).length;
    if (beatIndexRef.current < total - 1) goToBeat(beatIndexRef.current + 1);
  }, [goToBeat, goToQuizSlide]);

  /**
   * Leaves every overlay and returns the projector to the current slide (or
   * the welcome screen, when the warm-up was started before the lesson).
   */
  const backToLessonSlides = useCallback(() => {
    const lesson = activeLessonRef.current;
    if (!lesson) return;

    if (warmupRef.current === 'd20' || warmupRef.current === 'comp') {
      broadcast({ type: 'warmupEnd' });
    }
    if (warmupRef.current === 'live' || liveQuizRef.current) {
      broadcast({ type: 'quizEnd' });
    }

    modeRef.current = 'lesson';
    setMode('lesson');
    resetWarmupState();

    if (phaseRef.current === 'welcome') {
      broadcast({ type: 'welcome', welcome: lesson.welcome });
      return;
    }

    const slide = flattenBeats(lesson)[beatIndexRef.current]?.slide;
    if (slide) {
      broadcast({
        type: 'slide',
        lessonId: lesson.id,
        index: beatIndexRef.current,
        slide,
        imageUrl: imageUrlsRef.current[beatIndexRef.current],
      });
    }
  }, [broadcast, resetWarmupState]);

  useEffect(() => {
    if (!activeLesson || quizModalOpen || warmupModal !== 'none') return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      if (event.key === 'ArrowLeft') goPrev();
      else goNext();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeLesson, goNext, goPrev, quizModalOpen, warmupModal]);

  /* ------------------------------------------------------------------ */
  /* Session actions                                                     */
  /* ------------------------------------------------------------------ */

  const startLesson = useCallback((lesson: Lesson) => {
    const code = randomRoomCode();
    activeLessonRef.current = lesson;
    beatIndexRef.current = 0;
    quizIndexRef.current = 0;
    modeRef.current = 'lesson';
    phaseRef.current = 'welcome';
    imageUrlsRef.current = {};
    liveQuizRef.current = null;
    resetWarmupState();
    setActiveLesson(lesson);
    setSessionCode(code);
    setBeatIndex(0);
    setQuizIndex(0);
    setMode('lesson');
    setPhase('welcome');
    setImageUrls({});
    setImageInput('');
    setLiveQuizCode(null);
    setHostUrl('');
    setConnection('connecting');
    setTvOnline(false);
    setTvUrl(`${window.location.origin}/tela?c=${code}`);
  }, [resetWarmupState]);

  /* Deep link used by the agenda/history: /professor?aula=<occurrenceId>. */
  useEffect(() => {
    if (openedFromQueryRef.current || !lessons || lessons.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const occurrenceId = params.get('aula');
    if (!occurrenceId) return;
    const lesson = lessons.find(
      (candidate) => (candidate.occurrenceId ?? candidate.id) === occurrenceId
    );
    if (!lesson) return;

    openedFromQueryRef.current = true;
    startLesson(lesson);
    const url = new URL(window.location.href);
    url.searchParams.delete('aula');
    window.history.replaceState(null, '', `${url.pathname}${url.search}`);
  }, [lessons, startLesson]);

  /** Leaves the welcome screen and broadcasts beat 0. */
  const startLive = useCallback(() => {
    const lesson = activeLessonRef.current;
    if (!lesson) return;
    if (flattenBeats(lesson).length === 0) return;

    phaseRef.current = 'live';
    setPhase('live');
    goToBeat(0);
  }, [goToBeat]);

  const endSession = useCallback(() => {
    /* Tell the projector before the channel goes away; its presence timeout is
       just the safety net if this message is ever dropped. */
    channelRef.current?.send({ type: 'end' });
    removeStorage(AULA_SESSION_STORAGE);
    activeLessonRef.current = null;
    beatIndexRef.current = 0;
    quizIndexRef.current = 0;
    modeRef.current = 'lesson';
    phaseRef.current = 'welcome';
    imageUrlsRef.current = {};
    liveQuizRef.current = null;
    resetWarmupState();
    setActiveLesson(null);
    setSessionCode('');
    setTvUrl('');
    setBeatIndex(0);
    setQuizIndex(0);
    setMode('lesson');
    setPhase('welcome');
    setImageUrls({});
    setImageInput('');
    setLiveQuizCode(null);
    setHostUrl('');
    setQuizModalOpen(false);
    setConnection('idle');
    setTvOnline(false);
  }, [resetWarmupState]);

  const logout = useCallback(() => {
    removeStorage(AULA_GATE_STORAGE);
    removeStorage(AULA_SESSION_STORAGE);
    setAuthed(false);
    setGateInput('');
    endSession();
  }, [endSession]);

  const submitGate = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (gateInput.trim().toUpperCase() === PASSAPORTE_GATE_CODE) {
        writeStorage(AULA_GATE_STORAGE, '1');
        setAuthed(true);
        setGateError('');
        setGateInput('');
        return;
      }
      setGateError('Código incorreto. Confira com a coordenação.');
    },
    [gateInput]
  );

  const copyValue = useCallback(async (value: string, kind: 'code' | 'url') => {
    const ok = await copyToClipboard(value);
    if (!ok) return;
    setCopied(kind);
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopied(null), 1800);
  }, []);

  /**
   * Stores the scene image for the current beat and re-broadcasts the slide.
   * An empty URL clears the image. This never uploads anything — the TV just
   * renders the link.
   */
  const applySceneImage = useCallback(
    (rawUrl: string) => {
      const lesson = activeLessonRef.current;
      if (!lesson) return;
      const index = beatIndexRef.current;
      const slide = flattenBeats(lesson)[index]?.slide;
      if (!slide) return;

      const url = rawUrl.trim();
      const next = { ...imageUrlsRef.current };
      if (url) next[index] = url;
      else delete next[index];

      imageUrlsRef.current = next;
      setImageUrls(next);
      setImageInput(url);
      broadcast({
        type: 'slide',
        lessonId: lesson.id,
        index,
        slide,
        imageUrl: url || undefined,
      });
    },
    [broadcast]
  );

  /* ------------------------------------------------------------------ */
  /* Quiz                                                                */
  /* ------------------------------------------------------------------ */

  const openQuizModal = useCallback(() => setQuizModalOpen(true), []);

  const startQuiz = useCallback(() => {
    const lesson = activeLessonRef.current;
    if (!lesson) return;
    setQuizModalOpen(false);

    if (warmupRef.current === 'd20' || warmupRef.current === 'comp') {
      broadcast({ type: 'warmupEnd' });
    }
    resetWarmupState();

    if (usePhones) {
      const params = new URLSearchParams({
        deck: lesson.deckId,
        room: sessionCode,
        seconds: String(seconds),
        auto: autoAdvance ? '1' : '0',
        lang: 'pt',
        start: '1',
      });
      const url = `${window.location.origin}/host?${params.toString()}`;
      liveQuizRef.current = sessionCode;
      warmupRef.current = 'live';
      modeRef.current = 'lesson';
      quizIndexRef.current = 0;
      setMode('lesson');
      setQuizIndex(0);
      setWarmup('live');
      setLiveQuizCode(sessionCode);
      window.open(url, '_blank', 'noopener,noreferrer');
      setHostUrl(url);
      broadcast({ type: 'quiz', code: sessionCode, active: true });
      return;
    }

    liveQuizRef.current = null;
    modeRef.current = 'quiz';
    quizIndexRef.current = 0;
    setLiveQuizCode(null);
    setHostUrl('');
    setMode('quiz');
    setQuizIndex(0);

    const slide = buildQuizSlides(lesson.deckId)[0];
    if (slide) {
      broadcast({ type: 'slide', lessonId: QUIZ_LESSON_ID, index: 0, slide });
    }
  }, [autoAdvance, broadcast, resetWarmupState, seconds, sessionCode, usePhones]);

  /* ------------------------------------------------------------------ */
  /* Warm-ups (Live / D20 / competition) — configured here, run on /tela  */
  /* ------------------------------------------------------------------ */

  const openWarmup = useCallback((kind: Exclude<WarmupKind, 'none'>) => {
    setQuizModalOpen(false);
    setWarmupModal(kind);
  }, []);

  /** LIVE avulso: opens /host in a new tab and puts the TV in spectator mode. */
  const startLiveWarmup = useCallback(() => {
    const lesson = activeLessonRef.current;
    if (!lesson) return;

    if (warmupRef.current === 'd20' || warmupRef.current === 'comp') {
      broadcast({ type: 'warmupEnd' });
    }
    if (warmupRef.current === 'live' && liveQuizRef.current) {
      broadcast({ type: 'quizEnd' });
    }

    const code = randomRoomCode();
    const params = new URLSearchParams({
      mode: 'classic',
      difficulty: 'medium',
      room: code,
      seconds: String(liveSeconds),
      count: String(liveCount),
      auto: '1',
      lang: 'pt',
      start: '1',
    });
    if (liveTheme !== 'all') params.set('categories', liveTheme);
    const url = `${window.location.origin}/host?${params.toString()}`;

    resetWarmupState();
    window.open(url, '_blank', 'noopener,noreferrer');
    warmupRef.current = 'live';
    liveQuizRef.current = code;
    modeRef.current = 'lesson';
    setWarmup('live');
    setLiveQuizCode(code);
    setHostUrl(url);
    broadcast({ type: 'quiz', code, active: true });
  }, [broadcast, liveCount, liveSeconds, liveTheme, resetWarmupState]);

  const broadcastD20Game = useCallback(
    (state: D20GameState) => {
      const seq = (d20GameRef.current?.seq ?? 0) + 1;
      const next = { ...state, seq };
      d20GameRef.current = next;
      setD20Game(next);
      broadcast({ type: 'game', game: 'd20', seq, state: next });
    },
    [broadcast]
  );

  const startD20Game = useCallback(() => {
    if (warmupRef.current === 'live' || liveQuizRef.current) {
      broadcast({ type: 'quizEnd' });
    } else if (warmupRef.current !== 'none') {
      broadcast({ type: 'warmupEnd' });
    }
    resetWarmupState();
    warmupRef.current = 'd20';
    setWarmup('d20');
    setWarmupModal('none');
    broadcastD20Game({
      seq: 1,
      phase: 'board',
      number: null,
      question: null,
      revealed: false,
      lastAnswerCorrect: null,
      score: { correct: 0, total: 0 },
      streak: 0,
      bestStreak: 0,
      round: 1,
      maxRounds: 20,
    });
  }, [broadcast, broadcastD20Game, resetWarmupState]);

  const pickD20Number = useCallback(
    (number: number) => {
      const game = d20GameRef.current;
      if (!game || game.phase !== 'board') return;
      const deck = getDeck('classic', 'medium');
      if (deck.length === 0) return;
      const pick = deck[Math.floor(Math.random() * deck.length)] ?? deck[0];
      broadcastD20Game({
        ...game,
        phase: 'question',
        number,
        question: {
          id: pick.id,
          text: pick.text,
          answer: pick.answer,
          explanation: pick.explanation,
        },
        revealed: false,
        lastAnswerCorrect: null,
      });
    },
    [broadcastD20Game]
  );

  const randomD20 = useCallback(() => {
    pickD20Number(1 + Math.floor(Math.random() * 20));
  }, [pickD20Number]);

  const revealD20Game = useCallback(
    (correct: boolean) => {
      const game = d20GameRef.current;
      if (!game || game.phase !== 'question') return;
      const streak = correct ? game.streak + 1 : 0;
      broadcastD20Game({
        ...game,
        phase: 'revealed',
        revealed: true,
        lastAnswerCorrect: correct,
        score: {
          correct: game.score.correct + (correct ? 1 : 0),
          total: game.score.total + 1,
        },
        streak,
        bestStreak: Math.max(game.bestStreak, streak),
      });
    },
    [broadcastD20Game]
  );

  const nextD20Game = useCallback(() => {
    const game = d20GameRef.current;
    if (!game || game.phase !== 'revealed') return;
    if (game.round >= game.maxRounds) {
      broadcastD20Game({ ...game, phase: 'over' });
      return;
    }
    broadcastD20Game({
      ...game,
      phase: 'board',
      number: null,
      question: null,
      revealed: false,
      lastAnswerCorrect: null,
      round: game.round + 1,
    });
  }, [broadcastD20Game]);

  const newD20Game = useCallback(() => {
    const game = d20GameRef.current;
    if (!game) return;
    broadcastD20Game({
      ...game,
      phase: 'board',
      number: null,
      question: null,
      revealed: false,
      lastAnswerCorrect: null,
      score: { correct: 0, total: 0 },
      streak: 0,
      bestStreak: 0,
      round: 1,
    });
  }, [broadcastD20Game]);

  const endD20Game = useCallback(() => {
    broadcast({ type: 'gameEnd' });
    resetWarmupState();
    sendCurrentSlide();
  }, [broadcast, resetWarmupState, sendCurrentSlide]);

  const startD20Warmup = useCallback(() => {
    startD20Game();
  }, [startD20Game]);

  const drawCompQuestion = useCallback(
    (flatTurn: number) => {
      const names = compNamesRef.current;
      const rounds = compRoundsRef.current;
      const deck = getDeck('classic', 'medium');
      if (names.length === 0 || deck.length === 0) return;

      const pick = deck[Math.floor(Math.random() * deck.length)] ?? deck[0];
      const student = names[flatTurn % names.length] ?? names[0];
      const round = Math.floor(flatTurn / names.length) + 1;
      const scores = names.map((name) => ({
        name,
        score: compScoresRef.current[name] ?? 0,
      }));

      const message: AulaCompMessage = {
        type: 'comp',
        student,
        text: pick.text,
        answer: pick.answer,
        explanation: pick.explanation,
        revealed: false,
        scores,
        round,
        totalRounds: rounds,
      };

      compTurnRef.current = flatTurn;
      compMessageRef.current = message;
      setCompMessage(message);
      compRankingRef.current = null;
      setCompRanking(null);
      warmupRef.current = 'comp';
      setWarmup('comp');
      broadcast(message);
    },
    [broadcast]
  );

  const startCompWarmup = useCallback(() => {
    const names = compNames.map((name) => name.trim()).filter(Boolean);
    if (names.length < 2) return;

    if (warmupRef.current === 'live' || liveQuizRef.current) {
      broadcast({ type: 'quizEnd' });
    }
    if (warmupRef.current === 'd20') {
      broadcast({ type: 'warmupEnd' });
    }
    resetWarmupState();

    compNamesRef.current = names;
    compRoundsRef.current = compRounds;
    compScoresRef.current = Object.fromEntries(names.map((name) => [name, 0]));
    compTurnRef.current = 0;
    setWarmupModal('none');
    drawCompQuestion(0);
  }, [broadcast, compNames, compRounds, drawCompQuestion, resetWarmupState]);

  const markComp = useCallback(
    (correct: boolean) => {
      const message = compMessageRef.current;
      if (!message || message.revealed) return;

      if (correct) {
        compScoresRef.current = {
          ...compScoresRef.current,
          [message.student]: (compScoresRef.current[message.student] ?? 0) + 1,
        };
      }

      const scores = compNamesRef.current.map((name) => ({
        name,
        score: compScoresRef.current[name] ?? 0,
      }));
      const next: AulaCompMessage = { ...message, revealed: true, scores };
      compMessageRef.current = next;
      setCompMessage(next);
      broadcast(next);
    },
    [broadcast]
  );

  const nextCompTurn = useCallback(() => {
    const names = compNamesRef.current;
    const totalTurns = names.length * compRoundsRef.current;
    const next = compTurnRef.current + 1;

    if (next >= totalTurns) {
      const ranking = names
        .map((name) => ({ name, score: compScoresRef.current[name] ?? 0 }))
        .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
      compRankingRef.current = ranking;
      setCompRanking(ranking);
      broadcast({ type: 'compEnd', ranking });
      return;
    }

    drawCompQuestion(next);
  }, [broadcast, drawCompQuestion]);

  const addCompName = useCallback(() => {
    const name = compNameInput.trim().slice(0, 24);
    if (!name) return;
    setCompNames((current) =>
      current.some((item) => item.toLowerCase() === name.toLowerCase()) ? current : [...current, name]
    );
    setCompNameInput('');
  }, [compNameInput]);

  const removeCompName = useCallback((name: string) => {
    setCompNames((current) => current.filter((item) => item !== name));
  }, []);

  /* ------------------------------------------------------------------ */
  /* Roleta no palco único                                                */
  /* ------------------------------------------------------------------ */

  const broadcastWheel = useCallback(
    (state: WheelGameState) => {
      const seq = (wheelGameRef.current?.seq ?? 0) + 1;
      const next = { ...state, seq };
      wheelGameRef.current = next;
      setWheelGame(next);
      broadcast({ type: 'game', game: 'wheel', seq, state: next });
    },
    [broadcast]
  );

  const startWheelWarmup = useCallback(() => {
    if (warmupRef.current === 'live' || liveQuizRef.current) {
      broadcast({ type: 'quizEnd' });
    }
    if (warmupRef.current === 'd20' || warmupRef.current === 'comp') {
      broadcast({ type: 'warmupEnd' });
    }
    resetWarmupState();

    const categories = wheelCategories.length
      ? wheelCategories
      : CLASSIC_ALL_CATEGORIES;
    const parsed = wheelRoundsInput.trim() ? Number(wheelRoundsInput) : NaN;
    const rounds =
      Number.isFinite(parsed) && parsed > 0 ? Math.min(50, Math.floor(parsed)) : null;

    wheelUsedRef.current.clear();
    warmupRef.current = 'wheel';
    setWarmup('wheel');
    setWarmupModal('none');
    broadcastWheel({
      seq: 1,
      phase: 'idle',
      categories,
      rotation: 0,
      picked: null,
      round: 0,
      rounds,
      score: { correct: 0, total: 0 },
      question: null,
      revealed: false,
      lastAnswerCorrect: null,
      spinId: 0,
    });
  }, [broadcast, broadcastWheel, resetWarmupState, wheelCategories, wheelRoundsInput]);

  const spinWheel = useCallback(() => {
    const game = wheelGameRef.current;
    if (!game || game.phase !== 'idle') return;
    const categories = game.categories.length ? game.categories : CLASSIC_ALL_CATEGORIES;
    if (categories.length === 0) return;

    const index = Math.floor(Math.random() * categories.length);
    const segmentAngle = 360 / categories.length;
    const center = index * segmentAngle + segmentAngle / 2;
    const normalized = ((game.rotation % 360) + 360) % 360;
    const desired = (360 - center + 360) % 360;
    const delta = (desired - normalized + 360) % 360;
    const rotation = game.rotation + 360 * 5 + delta;

    broadcastWheel({
      ...game,
      phase: 'spinning',
      rotation,
      picked: null,
      question: null,
      revealed: false,
      lastAnswerCorrect: null,
      spinId: game.spinId + 1,
    });

    if (wheelSpinTimerRef.current) window.clearTimeout(wheelSpinTimerRef.current);
    wheelSpinTimerRef.current = window.setTimeout(() => {
      wheelSpinTimerRef.current = null;
      const current = wheelGameRef.current;
      if (!current || current.phase !== 'spinning') return;
      const category = categories[index];
      const deck = getClassicDeck(wheelDifficulty, [category]);
      const fresh = deck.filter((item) => !wheelUsedRef.current.has(item.id));
      const pool = fresh.length > 0 ? fresh : deck;
      const pick = pool[Math.floor(Math.random() * pool.length)];
      if (!pick) {
        broadcastWheel({ ...current, phase: 'over', picked: category });
        return;
      }
      wheelUsedRef.current.add(pick.id);
      broadcastWheel({
        ...current,
        phase: 'question',
        picked: category,
        round: current.round + 1,
        question: {
          id: pick.id,
          text: pick.text,
          answer: pick.answer,
          explanation: pick.explanation,
        },
      });
    }, 3100);
  }, [broadcastWheel, wheelDifficulty]);

  const answerWheel = useCallback(
    (correct: boolean) => {
      const game = wheelGameRef.current;
      if (!game || game.phase !== 'question') return;
      broadcastWheel({
        ...game,
        phase: 'revealed',
        revealed: true,
        lastAnswerCorrect: correct,
        score: {
          correct: game.score.correct + (correct ? 1 : 0),
          total: game.score.total + 1,
        },
      });
    },
    [broadcastWheel]
  );

  const nextWheel = useCallback(() => {
    const game = wheelGameRef.current;
    if (!game) return;

    if (game.phase === 'over') {
      wheelUsedRef.current.clear();
      broadcastWheel({
        ...game,
        phase: 'idle',
        picked: null,
        round: 0,
        score: { correct: 0, total: 0 },
        question: null,
        revealed: false,
        lastAnswerCorrect: null,
      });
      return;
    }

    if (game.phase !== 'revealed') return;
    if (game.rounds !== null && game.round >= game.rounds) {
      broadcastWheel({ ...game, phase: 'over' });
      return;
    }

    broadcastWheel({
      ...game,
      phase: 'idle',
      picked: null,
      question: null,
      revealed: false,
      lastAnswerCorrect: null,
    });
  }, [broadcastWheel]);

  const endWheel = useCallback(() => {
    if (wheelSpinTimerRef.current) {
      window.clearTimeout(wheelSpinTimerRef.current);
      wheelSpinTimerRef.current = null;
    }
    broadcast({ type: 'gameEnd' });
    resetWarmupState();
    sendCurrentSlide();
  }, [broadcast, resetWarmupState, sendCurrentSlide]);

  useEffect(() => {
    if (wheelSpinRequest === 0) return;
    spinWheel();
  }, [wheelSpinRequest, spinWheel]);

  const toggleWheelCategory = (category: ClassicCategoryId) => {
    setWheelCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category]
    );
  };

  /* ------------------------------------------------------------------ */
  /* Passa Repassa no palco único                                        */
  /* ------------------------------------------------------------------ */

  const broadcastPassa = useCallback(
    (state: PassaGameState) => {
      const seq = (passaGameRef.current?.seq ?? 0) + 1;
      const next = { ...state, seq };
      passaGameRef.current = next;
      setPassaGame(next);
      broadcast({ type: 'game', game: 'passa', seq, state: next });
    },
    [broadcast]
  );

  const drawPassaQuestion = useCallback((): PassaQuestion | null => {
    const deck = getLiveDeck('classic', passaDifficulty, CLASSIC_ALL_CATEGORIES);
    const fresh = deck.filter((item) => !passaUsedRef.current.has(item.id));
    const pool = fresh.length > 0 ? fresh : deck;
    if (pool.length === 0) return null;

    const raw = pool[Math.floor(Math.random() * pool.length)];
    passaUsedRef.current.add(raw.id);
    const prepared = prepareQuestion(raw);
    return {
      id: raw.id,
      text: prepared.text,
      options: prepared.options,
      correctIndex: prepared.correctIndex,
      explanation: raw.explanation,
      category: raw.category,
    };
  }, [passaDifficulty]);

  const startPassaWarmup = useCallback(() => {
    if (warmupRef.current === 'live' || liveQuizRef.current) {
      broadcast({ type: 'quizEnd' });
    } else if (warmupRef.current !== 'none') {
      broadcast({ type: 'warmupEnd' });
    }
    resetWarmupState();
    passaUsedRef.current.clear();

    const team1 = passaTeam1.trim() || 'Time 1';
    const team2 = passaTeam2.trim() || 'Time 2';
    const question = drawPassaQuestion();
    const teams: [string, string] = [team1, team2];

    warmupRef.current = 'passa';
    setWarmup('passa');
    setWarmupModal('none');
    broadcastPassa({
      seq: 1,
      phase: question ? 'question' : 'over',
      teams,
      scores: [0, 0],
      activeTeam: 0,
      starter: 0,
      target: passaTarget,
      round: question ? 1 : 0,
      question,
      chosenIndex: null,
      revealed: false,
      lastResult: null,
      deadline: question ? Date.now() + 20_000 : null,
      winner: null,
    });
  }, [broadcast, broadcastPassa, drawPassaQuestion, passaTarget, passaTeam1, passaTeam2, resetWarmupState]);

  const answerPassa = useCallback(
    (optionIndex: number) => {
      const game = passaGameRef.current;
      if (!game || !game.question) return;
      if (game.phase !== 'question' && game.phase !== 'steal') return;

      const correct = optionIndex === game.question.correctIndex;
      if (correct) {
        const scores: [number, number] = [game.scores[0], game.scores[1]];
        scores[game.activeTeam] += 1;
        broadcastPassa({
          ...game,
          scores,
          phase: 'reveal',
          chosenIndex: optionIndex,
          revealed: true,
          deadline: null,
          lastResult: {
            team: game.activeTeam,
            stolen: game.phase === 'steal',
            correct: true,
          },
          winner: scores[game.activeTeam] >= game.target ? game.activeTeam : null,
        });
        return;
      }

      if (game.phase === 'question') {
        broadcastPassa({
          ...game,
          phase: 'steal',
          activeTeam: game.activeTeam === 0 ? 1 : 0,
          chosenIndex: null,
          revealed: false,
          deadline: Date.now() + 20_000,
          lastResult: null,
        });
        return;
      }

      broadcastPassa({
        ...game,
        phase: 'reveal',
        chosenIndex: optionIndex,
        revealed: true,
        deadline: null,
        lastResult: { team: null, stolen: false, correct: false },
      });
    },
    [broadcastPassa]
  );

  const nextPassa = useCallback(() => {
    const game = passaGameRef.current;
    if (!game || game.phase !== 'reveal') return;
    if (game.winner !== null) {
      broadcastPassa({ ...game, phase: 'over', deadline: null });
      return;
    }

    const nextStarter: 0 | 1 = game.starter === 0 ? 1 : 0;
    const question = drawPassaQuestion();
    if (!question) {
      broadcastPassa({ ...game, phase: 'over', starter: nextStarter, deadline: null });
      return;
    }
    broadcastPassa({
      ...game,
      phase: 'question',
      starter: nextStarter,
      activeTeam: nextStarter,
      round: game.round + 1,
      question,
      chosenIndex: null,
      revealed: false,
      lastResult: null,
      deadline: Date.now() + 20_000,
    });
  }, [broadcastPassa, drawPassaQuestion]);

  const newPassa = useCallback(() => {
    const game = passaGameRef.current;
    if (!game) return;
    passaUsedRef.current.clear();
    const question = drawPassaQuestion();
    broadcastPassa({
      ...game,
      phase: question ? 'question' : 'over',
      scores: [0, 0],
      activeTeam: 0,
      starter: 0,
      round: question ? 1 : 0,
      question,
      chosenIndex: null,
      revealed: false,
      lastResult: null,
      deadline: question ? Date.now() + 20_000 : null,
      winner: null,
    });
  }, [broadcastPassa, drawPassaQuestion]);

  const endPassa = useCallback(() => {
    broadcast({ type: 'gameEnd' });
    resetWarmupState();
    sendCurrentSlide();
  }, [broadcast, resetWarmupState, sendCurrentSlide]);

  useEffect(() => {
    if (!passaGame || !passaGame.deadline) return;
    if (passaGame.phase !== 'question' && passaGame.phase !== 'steal') return;
    const delay = Math.max(0, passaGame.deadline - Date.now());
    const timer = window.setTimeout(() => {
      const current = passaGameRef.current;
      if (!current || !current.deadline) return;
      if (current.phase === 'question') {
        broadcastPassa({
          ...current,
          phase: 'steal',
          activeTeam: current.activeTeam === 0 ? 1 : 0,
          chosenIndex: null,
          revealed: false,
          deadline: Date.now() + 20_000,
          lastResult: null,
        });
      } else if (current.phase === 'steal') {
        broadcastPassa({
          ...current,
          phase: 'reveal',
          chosenIndex: null,
          revealed: true,
          deadline: null,
          lastResult: { team: null, stolen: false, correct: false },
        });
      }
    }, delay);
    return () => window.clearTimeout(timer);
  }, [passaGame, broadcastPassa]);

  useEffect(() => {
    if (!quizModalOpen && warmupModal === 'none') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (quizModalOpen) setQuizModalOpen(false);
      else setWarmupModal('none');
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quizModalOpen, warmupModal]);

  /**
   * Warm-up setup modal shared by the welcome screen and the live session.
   * The actual game always runs on `/tela`; only the Live warm-up also opens
   * `/host` in a new tab so the teacher can drive the room.
   */
  const warmupModalView =
    warmupModal !== 'none' ? (
      <div
        className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 sm:items-center sm:p-6"
        onClick={() => setWarmupModal('none')}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="aula-warmup-title"
          onClick={(event) => event.stopPropagation()}
          className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl sm:p-6"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                Warm-up rápido
              </p>
              <h2 id="aula-warmup-title" className="mt-1 text-2xl font-black leading-tight">
                {warmupModal === 'live'
                  ? 'Live na TV'
                  : warmupModal === 'wheel'
                    ? 'Roleta na TV'
                    : warmupModal === 'passa'
                      ? 'Passa Repassa na TV'
                      : warmupModal === 'd20'
                        ? 'D20 na TV'
                        : 'Competição na TV'}
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setWarmupModal('none')}
              aria-label="Fechar configuração do warm-up"
              className="rounded-full border-2 border-[var(--line)] bg-[var(--surface-2)] p-1.5 text-[var(--muted)]"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>

          {warmupModal === 'live' ? (
            <>
              <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                Quiz ao vivo com celulares. O telão entra em modo espectador e o /host abre em
                nova aba para você controlar.
              </p>

              <fieldset className="mt-5">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Quantidade de perguntas
                </legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {LIVE_COUNTS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={liveCount === value}
                      onClick={() => setLiveCount(value)}
                      className={
                        liveCount === value
                          ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--ink)]'
                          : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--muted)] transition hover:border-[var(--line)]'
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-4">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Tempo por pergunta
                </legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {QUIZ_SECONDS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={liveSeconds === value}
                      onClick={() => setLiveSeconds(value)}
                      className={
                        liveSeconds === value
                          ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--ink)]'
                          : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--muted)] transition hover:border-[var(--line)]'
                      }
                    >
                      {value}s
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-4">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Tema
                </legend>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LIVE_THEMES.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      aria-pressed={liveTheme === item.id}
                      onClick={() => setLiveTheme(item.id)}
                      className={
                        liveTheme === item.id
                          ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-2 py-2 text-xs font-black text-[var(--ink)]'
                          : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-2 text-xs font-black text-[var(--muted)] transition hover:border-[var(--line)]'
                      }
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={startLiveWarmup}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
              >
                <Radio className="h-5 w-5" aria-hidden="true" />
                Abrir Live na TV
              </button>
            </>
          ) : warmupModal === 'passa' ? (
            <>
              <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                Dois times, 20 segundos por turno e repasse em caso de erro. O telão mostra a
                pergunta e o placar; você marca a opção escolhida pelo time.
              </p>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Time 1
                  <input
                    value={passaTeam1}
                    onChange={(event) => setPassaTeam1(event.target.value)}
                    className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                  />
                </label>
                <label className="flex flex-col gap-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Time 2
                  <input
                    value={passaTeam2}
                    onChange={(event) => setPassaTeam2(event.target.value)}
                    className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-bold text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                  />
                </label>
              </div>

              <fieldset className="mt-4">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Meta de pontos
                </legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {([5, 10, 15] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPassaTarget(value)}
                      aria-pressed={passaTarget === value}
                      className={
                        passaTarget === value
                          ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--ink)]'
                          : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--muted)]'
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>

              <fieldset className="mt-4">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Dificuldade
                </legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as DifficultyId[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setPassaDifficulty(value)}
                      aria-pressed={passaDifficulty === value}
                      className={
                        passaDifficulty === value
                          ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--ink)]'
                          : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--muted)]'
                      }
                    >
                      {value === 'easy' ? 'Fácil' : value === 'medium' ? 'Médio' : 'Difícil'}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={startPassaWarmup}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
              >
                <Trophy className="h-5 w-5" aria-hidden="true" />
                Iniciar Passa Repassa
              </button>
            </>
          ) : warmupModal === 'wheel' ? (
            <>
              <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                A roleta fica na TV e gira com clique nela. Configure os temas e o número de
                rodadas; vazio = infinito.
              </p>

              <fieldset className="mt-4">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Temas ({wheelCategories.length})
                </legend>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CLASSIC_CATEGORIES.map((category) => {
                    const active = wheelCategories.includes(category.id);
                    return (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => toggleWheelCategory(category.id)}
                        aria-pressed={active}
                        className={
                          active
                            ? 'rounded-full border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-black text-[var(--accent)]'
                            : 'rounded-full border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-bold text-[var(--muted)]'
                        }
                      >
                        {categoryCopy(category.id, 'pt').label}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    onClick={() => setWheelCategories(CLASSIC_ALL_CATEGORIES)}
                    className="rounded-full border-2 border-dashed border-[var(--line)] px-3 py-1.5 text-xs font-black text-[var(--muted)]"
                  >
                    Todos
                  </button>
                </div>
              </fieldset>

              <fieldset className="mt-4">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Dificuldade
                </legend>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {(['easy', 'medium', 'hard'] as DifficultyId[]).map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setWheelDifficulty(value)}
                      aria-pressed={wheelDifficulty === value}
                      className={
                        wheelDifficulty === value
                          ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--ink)]'
                          : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--muted)]'
                      }
                    >
                      {value === 'easy' ? 'Fácil' : value === 'medium' ? 'Médio' : 'Difícil'}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="mt-4 flex flex-col gap-1 text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                Rodadas
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={wheelRoundsInput}
                  onChange={(event) => setWheelRoundsInput(event.target.value)}
                  placeholder="∞ (infinito)"
                  className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-bold text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                />
                <span className="text-[10px] font-semibold normal-case tracking-normal">
                  Deixe vazio para jogar até você encerrar.
                </span>
              </label>

              <button
                type="button"
                onClick={startWheelWarmup}
                disabled={wheelCategories.length === 0}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)] disabled:opacity-50"
              >
                <Dices className="h-5 w-5" aria-hidden="true" />
                Iniciar roleta na TV
              </button>
            </>
          ) : warmupModal === 'd20' ? (
            <>
              <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                Abre o tabuleiro 4×5 na TV. Clique em um número ou role o D20; a pergunta
                True/False aparece e você marca Acertou/Errou por aqui.
              </p>
              <button
                type="button"
                onClick={startD20Warmup}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
              >
                <Dices className="h-5 w-5" aria-hidden="true" />
                Iniciar D20
              </button>
            </>
          ) : (
            <>
              <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                O telão mostra a pergunta e o placar. Marque Acertou/Errou aqui e avance até o
                pódio.
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  addCompName();
                }}
                className="mt-4 flex gap-2"
              >
                <input
                  value={compNameInput}
                  onChange={(event) => setCompNameInput(event.target.value)}
                  placeholder="Nome do aluno"
                  aria-label="Nome do aluno na competição"
                  maxLength={24}
                  className="min-w-0 flex-1 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                />
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--ink)] transition hover:border-[var(--accent)]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  Adicionar
                </button>
              </form>

              {compNames.length > 0 ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {compNames.map((name) => (
                    <li
                      key={name}
                      className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1 text-xs font-black text-[var(--ink)]"
                    >
                      {name}
                      <button
                        type="button"
                        onClick={() => removeCompName(name)}
                        aria-label={`Remover ${name}`}
                        className="text-[var(--muted)] transition hover:text-[var(--danger)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
                  Adicione pelo menos 2 alunos.
                </p>
              )}

              <fieldset className="mt-4">
                <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                  Rodadas
                </legend>
                <div className="mt-2 grid grid-cols-4 gap-2">
                  {COMP_ROUNDS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      aria-pressed={compRounds === value}
                      onClick={() => setCompRounds(value)}
                      className={
                        compRounds === value
                          ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-2 py-2.5 text-sm font-black text-[var(--ink)]'
                          : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-2.5 text-sm font-black text-[var(--muted)] transition hover:border-[var(--line)]'
                      }
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </fieldset>

              <button
                type="button"
                onClick={startCompWarmup}
                disabled={compNames.length < 2}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)] disabled:opacity-50"
              >
                <Trophy className="h-5 w-5" aria-hidden="true" />
                Começar competição na TV
              </button>
            </>
          )}

          <p className="mt-3 text-[11px] font-semibold text-[var(--muted)]">
            Enquanto o warm-up estiver ativo, o telão ignora os slides. Use “Voltar aos slides”
            para retomar.
          </p>
        </div>
      </div>
    ) : null;

  /* ------------------------------------------------------------------ */
  /* Render: loading / gate                                              */
  /* ------------------------------------------------------------------ */

  if (!mounted) {
    return (
      <main className="theme-dark game-shell flex min-h-dvh items-center justify-center">
        <span className="h-10 w-10 animate-pulse rounded-full bg-[var(--surface-2)]" />
      </main>
    );
  }

  if (!authed) {
    return (
      <main className="theme-dark game-shell flex min-h-dvh items-center justify-center px-4 py-10 text-[var(--ink)]">
        <section className="w-full max-w-md rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--card-shadow)]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent)]">
            <KeyRound className="h-6 w-6" aria-hidden="true" />
          </span>
          <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            Supp · Aulas
          </p>
          <h1 className="mt-1 text-3xl font-black leading-tight">Área do professor</h1>
          <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
            Digite o código de acesso para abrir o roteiro e sincronizar o telão.
          </p>

          <form onSubmit={submitGate} className="mt-6">
            <label
              htmlFor="aula-gate"
              className="block text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]"
            >
              Código de acesso
            </label>
            <input
              id="aula-gate"
              value={gateInput}
              onChange={(event) =>
                setGateInput(
                  event.target.value
                    .toUpperCase()
                    .replace(/[^A-Z0-9]/g, '')
                    .slice(0, 8)
                )
              }
              autoComplete="off"
              autoCapitalize="characters"
              maxLength={8}
              autoFocus
              aria-label="Código de acesso do professor"
              className="mt-2 w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-center text-2xl font-black tracking-[0.35em] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
            />
            {gateError ? (
              <p role="alert" className="mt-3 text-sm font-bold text-[var(--danger)]">
                {gateError}
              </p>
            ) : null}
            <button
              type="submit"
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              <KeyRound className="h-5 w-5" aria-hidden="true" />
              Entrar
            </button>
          </form>

          <p className="mt-5 text-[11px] font-semibold text-[var(--muted)]">
            O telão não precisa deste código — alunos e projetor usam apenas o código da sessão.
          </p>
        </section>
      </main>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Render: lesson picker                                               */
  /* ------------------------------------------------------------------ */

  if (!activeLesson) {
    const showAgendaNotice = (message: string) => {
      setAgendaNotice(message);
      window.setTimeout(() => setAgendaNotice(''), 4500);
    };

    const openOccurrence = (occurrenceId: string) => {
      const lesson = (lessons ?? []).find(
        (candidate) => (candidate.occurrenceId ?? candidate.id) === occurrenceId
      );
      if (lesson) {
        startLesson(lesson);
        return;
      }
      showAgendaNotice(
        'Essa aula ainda não tem conteúdo planejado. A biblioteca para atribuir aulas chega na próxima fase.'
      );
    };

    const planLesson = () => {
      showAgendaNotice(
        'A biblioteca para planejar/atribuir aulas será implementada na próxima fase.'
      );
    };

    const renderLessonGroup = (group: { date: string; items: Lesson[] }) => {
      const badge = lessonDayBadge(group.date, today);
      return (
        <section key={group.date || 'sem-data'}>
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2 border-b border-[var(--line-soft)] pb-2">
            <div className="flex flex-wrap items-center gap-2">
              {badge ? (
                <span
                  className={clsx(
                    'rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em]',
                    badge === 'Hoje'
                      ? 'bg-[var(--accent)] text-[#071018]'
                      : 'border border-[var(--line-soft)] bg-[var(--surface)] text-[var(--accent)]'
                  )}
                >
                  {badge}
                </span>
              ) : null}
              <h2 className="text-lg font-black leading-tight">
                {formatLessonDay(group.date)}
              </h2>
            </div>
            <span className="text-[11px] font-bold uppercase tracking-wide text-[var(--muted)]">
              {group.items.length} {group.items.length === 1 ? 'aula' : 'aulas'}
            </span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((lesson) => {
              const isToday = today !== '' && lesson.date === today;
              return (
                <article
                  key={lesson.id}
                  className="flex flex-col rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--panel-shadow)]"
                >
                  {isToday ? (
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#071018]">
                        Aula de hoje
                      </span>
                    </div>
                  ) : null}

                  <h3 className="text-xl font-black leading-tight">{lesson.title}</h3>
                  <p className="mt-2 text-sm font-bold text-[var(--muted)]">{lesson.turma}</p>
                  <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                    {lesson.totalMin} min · {lesson.segments.length} blocos ·{' '}
                    {flattenBeats(lesson).length} beats
                  </p>

                  <button
                    type="button"
                    onClick={() => startLesson(lesson)}
                    className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-4 py-3 text-sm font-black uppercase tracking-wide text-[var(--cta-text)]"
                  >
                    <MonitorPlay className="h-4 w-4" aria-hidden="true" />
                    Iniciar aula
                  </button>
                </article>
              );
            })}
          </div>
        </section>
      );
    };

    return (
      <main className="theme-dark game-shell min-h-dvh px-4 py-6 text-[var(--ink)] sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <header className="flex flex-wrap items-start justify-between gap-3">
            <Greeting
              currentLesson={
                currentLesson
                  ? { title: currentLesson.title, turma: currentLesson.turma }
                  : null
              }
            />
            <div className="flex flex-wrap items-center gap-2">
              <CursorToggle />
              <button
                type="button"
                onClick={logout}
                className="flex items-center gap-2 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            </div>
          </header>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
            <ProfessorNav />
            <span className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)]">
              {agendaLoading ? 'Atualizando agenda…' : agenda ? 'Agenda sincronizada' : ''}
            </span>
          </div>

          {agendaNotice ? (
            <div className="mt-3 rounded-2xl border-2 border-[var(--accent)]/50 bg-[var(--surface-2)] px-4 py-2.5 text-xs font-bold text-[var(--ink)]">
              {agendaNotice}
            </div>
          ) : null}

          {agenda ? (
            <>
              <div className="mt-4">
                <WeekAgenda
                  data={agenda}
                  lessons={lessons ?? []}
                  now={now}
                  onOpenOccurrence={openOccurrence}
                />
              </div>

              <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
                <NextClassCard
                  occurrence={featured}
                  classroom={featuredClass}
                  title={featuredTitle}
                  isNow={Boolean(ongoing)}
                  now={now}
                  today={today}
                  hasLesson={Boolean(featuredLesson)}
                  onOpen={() => featured && openOccurrence(featured.id)}
                  onPlan={planLesson}
                />
                <TodayClasses
                  occurrences={todayOccurrences}
                  classes={agenda.classes}
                  contents={agenda.contents}
                  lessons={lessons ?? []}
                  now={now}
                  onOpen={openOccurrence}
                  onPlan={planLesson}
                />
              </div>
            </>
          ) : (
            <div className="mt-4 rounded-3xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-6 text-sm font-bold text-[var(--muted)]">
              Carregando agenda…
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-end justify-between gap-2 border-b border-[var(--line-soft)] pb-2">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                Aulas
              </p>
              <h2 className="mt-1 text-2xl font-black">Aulas por dia</h2>
            </div>
            <p className="text-xs font-semibold text-[var(--muted)]">
              Hoje e próximas primeiro; as anteriores ficam no fim.
            </p>
          </div>

          {lessons === null || lessonsLoading ? (
            <p
              role="status"
              className="mt-6 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-6 text-sm font-bold text-[var(--muted)]"
            >
              Carregando aulas…
            </p>
          ) : lessonsError ? (
            <div className="mt-6 rounded-2xl border-2 border-[var(--danger)]/60 bg-[var(--surface-2)] px-4 py-6">
              <p className="text-sm font-bold text-[var(--ink)]">
                Não foi possível carregar as aulas agora.
              </p>
              <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
                Confira a conexão e tente de novo.
              </p>
              <button
                type="button"
                onClick={() => setLessonsNonce((value) => value + 1)}
                className="mt-4 rounded-xl bg-[var(--cta-bg)] px-4 py-2.5 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
              >
                Tentar de novo
              </button>
            </div>
          ) : (
            <div className="mt-8 space-y-10">
              {lessonGroups.upcoming.map(renderLessonGroup)}
              {lessonGroups.past.length ? (
                <div className="space-y-8">
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-[var(--muted)]">
                    Aulas anteriores
                  </p>
                  {lessonGroups.past.map(renderLessonGroup)}
                </div>
              ) : null}
            </div>
          )}

          <p className="mt-6 text-xs font-semibold text-[var(--muted)]">
            Ao iniciar, o Supp gera um código de sessão e a URL do telão. O projetor abre
            <span className="font-black text-[var(--ink)]"> /tela</span> e acompanha cada slide.
          </p>
        </div>
      </main>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Render: welcome (pre-class)                                         */
  /* ------------------------------------------------------------------ */

  const welcomeTitle = activeLesson.welcome?.title || AULA_WELCOME_FALLBACK.title;
  const welcomeMessage = activeLesson.welcome?.message || AULA_WELCOME_FALLBACK.message;
  const welcomeMessage2 = activeLesson.welcome?.message2 || AULA_WELCOME_FALLBACK.message2;

  if (phase === 'welcome') {
    return (
      <main className="theme-dark game-shell min-h-dvh px-4 py-6 text-[var(--ink)] sm:px-8">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-5">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                A aula vai começar!
              </p>
              <h1 className="mt-1 text-lg font-black leading-tight sm:text-xl">
                {activeLesson.title}
              </h1>
              <p className="text-xs font-bold text-[var(--muted)]">
                {activeLesson.turma} · {formatLessonDate(activeLesson.date)}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {activeLesson.contentId ? (
                <a
                  href={`/professor/editor/${activeLesson.contentId}?occurrence=${activeLesson.occurrenceId ?? ''}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar
                </a>
              ) : null}
              <ConnectionPill status={connection} tvOnline={tvOnline} />
              <button
                type="button"
                onClick={endSession}
                aria-label="Encerrar a aula e voltar para a lista"
                className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                Encerrar aula
              </button>
              <button
                type="button"
                onClick={logout}
                aria-label="Sair da área do professor"
                className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sair
              </button>
            </div>
          </header>

          <WarmupBar active={warmup} onOpen={openWarmup} />

          {warmup === 'live' ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[var(--accent-2)] bg-[var(--surface)] px-4 py-3 text-sm font-black">
              <span className="flex items-center gap-2">
                <Radio className="h-4 w-4 text-[var(--accent-2)]" aria-hidden="true" />
                Live ativo na sala {liveQuizCode}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {hostUrl ? (
                  <a
                    href={hostUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Abrir /host
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={backToLessonSlides}
                  className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
                >
                  Voltar aos slides
                </button>
              </span>
            </div>
          ) : null}

          {warmup === 'd20' && d20Game ? (
            <D20Control
              state={d20Game}
              onPick={pickD20Number}
              onRandom={randomD20}
              onReveal={revealD20Game}
              onNext={nextD20Game}
              onNew={newD20Game}
              onEnd={endD20Game}
            />
          ) : null}

          {warmup === 'passa' && passaGame ? (
            <PassaControl
              state={passaGame}
              onAnswer={answerPassa}
              onNext={nextPassa}
              onNew={newPassa}
              onEnd={endPassa}
            />
          ) : null}

          {warmup === 'wheel' && wheelGame ? (
            <WheelControl
              state={wheelGame}
              onSpin={spinWheel}
              onAnswer={answerWheel}
              onNext={nextWheel}
              onEnd={endWheel}
            />
          ) : null}

          {warmup === 'comp' && compMessage ? (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[var(--accent-2)] bg-[var(--surface)] px-4 py-3">
              <span className="min-w-0 text-sm font-black text-[var(--ink)]">
                🏆 Competição: {compMessage.student} · rodada {compMessage.round ?? 1} de{' '}
                {compMessage.totalRounds ?? compRounds}
              </span>
              {compRanking ? (
                <span className="w-full text-xs font-black text-[var(--accent)]">
                  Fim da competição — pódio no telão.
                </span>
              ) : null}
              <span className="flex w-full flex-wrap gap-1.5 text-[11px] font-bold text-[var(--muted)]">
                {[...compMessage.scores]
                  .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
                  .map((row) => (
                    <span
                      key={row.name}
                      className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-0.5 text-[var(--ink)]"
                    >
                      {row.name}: {row.score}
                    </span>
                  ))}
              </span>
              <span className="flex flex-wrap items-center gap-2">
                {compRanking ? null : compMessage.revealed ? (
                  <button
                    type="button"
                    onClick={nextCompTurn}
                    className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
                  >
                    Próxima
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => markComp(true)}
                      className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#071018]"
                    >
                      Acertou
                    </button>
                    <button
                      type="button"
                      onClick={() => markComp(false)}
                      className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-white"
                    >
                      Errou
                    </button>
                  </>
                )}
                <button
                  type="button"
                  onClick={backToLessonSlides}
                  className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)]"
                >
                  Voltar aos slides
                </button>
              </span>
            </div>
          ) : null}

          <section className="rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-6 shadow-[var(--card-shadow)] sm:p-10">
            <div className="text-center">
              <h2 className="text-[clamp(2.6rem,7vw,5rem)] font-black leading-none">
                {welcomeTitle}
              </h2>
              <p className="mt-4 text-lg font-bold text-[var(--ink)] sm:text-2xl">
                {welcomeMessage}
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)] sm:text-base">
                {welcomeMessage2}
              </p>
            </div>

            <div className="mt-8 grid gap-5 rounded-3xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] p-5 md:grid-cols-[minmax(0,1fr)_auto]">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--muted)]">
                  Código da sessão
                </p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <p className="text-[clamp(2.6rem,7vw,4.4rem)] font-black leading-none tracking-[0.12em] text-[var(--accent)]">
                    {sessionCode}
                  </p>
                  <button
                    type="button"
                    onClick={() => void copyValue(sessionCode, 'code')}
                    aria-label="Copiar código da sessão"
                    className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-black text-[var(--muted)] transition hover:text-[var(--ink)]"
                  >
                    {copied === 'code' ? (
                      <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    {copied === 'code' ? 'Copiado' : 'Copiar'}
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <code className="min-w-0 max-w-full truncate rounded-xl border border-[var(--line-soft)] bg-[var(--surface)] px-3 py-2 text-xs font-bold text-[var(--muted)]">
                    {tvUrl}
                  </code>
                  <button
                    type="button"
                    onClick={() => void copyValue(tvUrl, 'url')}
                    aria-label="Copiar URL do telão"
                    className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-black text-[var(--muted)] transition hover:text-[var(--ink)]"
                  >
                    {copied === 'url' ? (
                      <Check className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                    ) : (
                      <Copy className="h-4 w-4" aria-hidden="true" />
                    )}
                    {copied === 'url' ? 'Copiado' : 'Copiar link'}
                  </button>
                </div>
                <p className="mt-2 text-[11px] font-semibold text-[var(--muted)]">
                  Deixe o telão aberto (TV, projetor ou segunda janela). Ele já está na tela de
                  boas-vindas.
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="rounded-2xl bg-white p-3 shadow-lg">
                  <QRCodeSVG value={tvUrl} size={144} fgColor="#0b1020" bgColor="#ffffff" />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={startLive}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-4 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              <MonitorPlay className="h-5 w-5" aria-hidden="true" />
              Iniciar aula
            </button>
            <p className="mt-3 text-center text-[11px] font-semibold text-[var(--muted)]">
              Ao iniciar, o telão troca a tela de boas-vindas pelo primeiro slide.
            </p>
          </section>
        </div>
        {warmupModalView}
      </main>
    );
  }

  /* ------------------------------------------------------------------ */
  /* Render: live session                                                */
  /* ------------------------------------------------------------------ */

  const quizTotal = quizSlides.length;
  const segmentIndex = activeLesson.segments.findIndex((item) => item.id === beat?.segmentId);

  return (
    <main className="theme-dark game-shell min-h-dvh px-3 py-4 text-[var(--ink)] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-[1500px]">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={endSession}
              aria-label="Encerrar a aula e voltar para a lista"
              className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              Encerrar aula
            </button>
            <span className="rounded-full bg-[var(--accent)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[#071018]">
              Ao vivo
            </span>
          </div>

          <div className="flex items-center gap-2">
            {activeLesson.contentId ? (
              <a
                href={`/professor/editor/${activeLesson.contentId}?occurrence=${activeLesson.occurrenceId ?? ''}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Editar
              </a>
            ) : null}
            <button
              type="button"
              onClick={() => void copyValue(sessionCode, 'code')}
              title="Copiar código da sessão"
              className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--accent)] hover:text-[var(--ink)]"
            >
              <span className="font-mono text-xs tracking-[0.16em] text-[var(--accent)]">
                {sessionCode}
              </span>
              {copied === 'code' ? (
                <Check className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
            </button>
            <ConnectionPill status={connection} tvOnline={tvOnline} />
            <button
              type="button"
              onClick={logout}
              aria-label="Sair da área do professor"
              className="flex items-center gap-1.5 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </div>
        </header>

        <h1 className="mt-3 text-xl font-black leading-tight sm:text-2xl">{activeLesson.title}</h1>
        <p className="mt-1 text-xs font-bold text-[var(--muted)]">
          {activeLesson.turma} · {formatLessonDate(activeLesson.date)}
        </p>

        <WarmupBar active={warmup} onOpen={openWarmup} />

        {connection === 'offline' ? (
          <p className="mt-3 rounded-xl border-2 border-amber-500/60 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-300">
            Supabase não configurado: o roteiro e a prévia funcionam, mas o telão não vai
            sincronizar. Defina NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY.
          </p>
        ) : null}

        {/* Quiz banners */}
        {mode === 'quiz' ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[var(--accent)] bg-[var(--surface)] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-black">
              <Presentation className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              Quiz na apresentação
              <span className="text-xs font-semibold text-[var(--muted)]">
                slide {quizIndex + 1} de {quizTotal} · sem celulares
              </span>
            </div>
            <button
              type="button"
              onClick={backToLessonSlides}
              className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--ink)] transition hover:border-[var(--accent)]"
            >
              Voltar ao roteiro
            </button>
          </div>
        ) : null}

        {liveQuizCode ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-2xl border-2 border-[var(--accent-2)] bg-[var(--surface)] px-4 py-3">
            <div className="flex items-center gap-2 text-sm font-black">
              <Radio className="h-4 w-4 text-[var(--accent-2)]" aria-hidden="true" />
              Quiz ao vivo na sala {liveQuizCode}
              <span className="text-xs font-semibold text-[var(--muted)]">
                alunos entram em supp.lol/join
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {hostUrl ? (
                <a
                  href={hostUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                  Abrir /host
                </a>
              ) : null}
              <button
                type="button"
                onClick={backToLessonSlides}
                className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
              >
                Voltar aos slides
              </button>
            </div>
          </div>
        ) : null}

        {warmup === 'd20' && d20Game ? (
          <D20Control
            state={d20Game}
            onPick={pickD20Number}
            onRandom={randomD20}
            onReveal={revealD20Game}
            onNext={nextD20Game}
            onNew={newD20Game}
            onEnd={endD20Game}
          />
        ) : null}

        {warmup === 'passa' && passaGame ? (
          <PassaControl
            state={passaGame}
            onAnswer={answerPassa}
            onNext={nextPassa}
            onNew={newPassa}
            onEnd={endPassa}
          />
        ) : null}

        {warmup === 'wheel' && wheelGame ? (
          <WheelControl
            state={wheelGame}
            onSpin={spinWheel}
            onAnswer={answerWheel}
            onNext={nextWheel}
            onEnd={endWheel}
          />
        ) : null}

        {warmup === 'comp' && compMessage ? (
          <div className="mt-3 rounded-2xl border-2 border-[var(--accent-2)] bg-[var(--surface)] px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 text-sm font-black">
                  <Trophy className="h-4 w-4 text-[var(--accent-2)]" aria-hidden="true" />
                  Competição na TV
                  <span className="text-xs font-semibold text-[var(--muted)]">
                    rodada {compMessage.round ?? 1} de {compMessage.totalRounds ?? compRounds} ·{' '}
                    {compMessage.student}
                  </span>
                </p>
                <p className="mt-1 text-base font-black leading-snug text-[var(--ink)]">
                  {compMessage.text}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                  Resposta:{' '}
                  <span className={compMessage.answer ? 'text-emerald-400' : 'text-rose-400'}>
                    {compMessage.answer ? 'TRUE' : 'FALSE'}
                  </span>
                  {compMessage.explanation ? ` · ${compMessage.explanation}` : ''}
                </p>
                <p className="mt-2 flex flex-wrap gap-1.5 text-[11px] font-bold text-[var(--muted)]">
                  {[...compMessage.scores]
                    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name))
                    .map((row) => (
                      <span
                        key={row.name}
                        className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-0.5 text-[var(--ink)]"
                      >
                        {row.name}: {row.score}
                      </span>
                    ))}
                </p>
                {compRanking ? (
                  <p className="mt-2 text-xs font-black text-[var(--accent)]">
                    Fim da competição — pódio no telão.
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {compRanking ? (
                  <button
                    type="button"
                    onClick={backToLessonSlides}
                    className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
                  >
                    Voltar aos slides
                  </button>
                ) : compMessage.revealed ? (
                  <button
                    type="button"
                    onClick={nextCompTurn}
                    className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
                  >
                    Próxima
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => markComp(true)}
                      className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#071018]"
                    >
                      Acertou
                    </button>
                    <button
                      type="button"
                      onClick={() => markComp(false)}
                      className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-white"
                    >
                      Errou
                    </button>
                  </>
                )}
                {!compRanking ? (
                  <button
                    type="button"
                    onClick={backToLessonSlides}
                    className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
                  >
                    Voltar aos slides
                  </button>
                ) : null}
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-3 grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)]">
          {/* Segment rail */}
          <aside className="rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-3">
            <p className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
              Blocos da aula
            </p>
            <nav className="mt-2 flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
              {activeLesson.segments.map((item, index) => {
                const isActive = mode === 'lesson' && item.id === beat?.segmentId;
                const firstBeat = beats.findIndex((candidate) => candidate.segmentId === item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => goToBeat(firstBeat)}
                    aria-current={isActive ? 'step' : undefined}
                    className={
                      isActive
                        ? 'flex min-w-[180px] items-center gap-2 rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-left lg:min-w-0'
                        : 'flex min-w-[180px] items-center gap-2 rounded-xl border-2 border-transparent bg-[var(--surface-2)]/60 px-3 py-2 text-left transition hover:border-[var(--line)] lg:min-w-0'
                    }
                  >
                    <span
                      className={
                        isActive
                          ? 'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--accent)] text-[11px] font-black text-[#071018]'
                          : 'flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-[var(--surface)] text-[11px] font-black text-[var(--muted)]'
                      }
                    >
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[11px] font-black leading-tight text-[var(--ink)]">
                        {item.label.replace(/^\d+\s*·\s*/, '')}
                      </span>
                      <span className="block text-[9px] font-bold uppercase tracking-wide text-[var(--muted)]">
                        {item.minutes} min · {item.slides.length} slide{item.slides.length > 1 ? 's' : ''}
                      </span>
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Teacher screen */}
          <section className="rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 sm:p-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                  {mode === 'quiz' ? 'Quiz da aula' : `Bloco ${segmentIndex + 1} de ${activeLesson.segments.length}`}
                </p>
                <h2 className="mt-0.5 text-lg font-black leading-tight sm:text-xl">
                  {mode === 'quiz' ? 'Apresentação do quiz' : (segment?.label ?? 'Roteiro')}
                </h2>
                {mode === 'lesson' && segment ? (
                  <p className="text-xs font-bold text-[var(--muted)]">
                    {segment.minutes} minutos · {segment.slides.length} slide
                    {segment.slides.length > 1 ? 's' : ''} neste bloco
                  </p>
                ) : null}
              </div>
              <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
                {mode === 'quiz' ? 'Slide' : 'Beat'} {Math.min(currentIndex + 1, totalItems)} / {totalItems}
              </span>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
              {/* Script */}
              <div className="min-w-0 space-y-4">
                {mode === 'lesson' && segment ? (
                  <>
                    <section>
                      <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                        <span aria-hidden="true" className="h-2 w-2 rounded-sm bg-[var(--accent)]" />
                        O que falar
                      </h3>
                      <ul className="mt-2 space-y-2">
                        {segment.talk.map((line) => (
                          <li
                            key={line}
                            className="rounded-xl border-l-4 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-lg font-black leading-snug text-[var(--ink)] sm:text-xl"
                          >
                            {line}
                          </li>
                        ))}
                      </ul>
                    </section>

                    <section>
                      <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent-2)]">
                        <span aria-hidden="true" className="h-2 w-2 rounded-sm bg-[var(--accent-2)]" />
                        O que fazer
                      </h3>
                      <ul className="mt-2 space-y-1.5">
                        {segment.do.map((line) => (
                          <li
                            key={line}
                            className="flex items-start gap-2 text-base font-semibold leading-snug text-[var(--muted)]"
                          >
                            <span
                              aria-hidden="true"
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--accent-2)]"
                            />
                            <span className="text-[var(--ink)]">{line}</span>
                          </li>
                        ))}
                      </ul>
                    </section>

                    {lessonSlide &&
                    (lessonSlide.teacherNote ||
                      ('note' in lessonSlide && Boolean(lessonSlide.note))) ? (
                      <section className="rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)]/70 p-3">
                        <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                          <span aria-hidden="true" className="h-2 w-2 rounded-sm bg-[var(--accent)]" />
                          Colinha
                        </h3>
                        <div className="mt-2 space-y-2">
                          {'note' in lessonSlide && lessonSlide.note ? (
                            <p className="rounded-xl border-l-4 border-[var(--accent)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold leading-snug text-[var(--ink)]">
                              <span className="mr-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent)]">
                                Anotação
                              </span>
                              {lessonSlide.note}
                            </p>
                          ) : null}
                          {lessonSlide.teacherNote ? (
                            lessonSlide.teacherNote.length > 280 ? (
                              <details className="rounded-xl border-l-4 border-[var(--accent-2)] bg-[var(--surface)] px-3 py-2">
                                <summary className="cursor-pointer text-xs font-black uppercase tracking-[0.14em] text-[var(--accent-2)]">
                                  Texto para ler — clique para abrir/fechar
                                </summary>
                                <div className="mt-2 max-h-56 overflow-y-auto whitespace-pre-line text-sm font-semibold leading-snug text-[var(--ink)]">
                                  {lessonSlide.teacherNote}
                                </div>
                              </details>
                            ) : (
                              <p className="rounded-xl border-l-4 border-[var(--accent-2)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold leading-snug text-[var(--ink)]">
                                <span className="mr-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent-2)]">
                                  Só para você
                                </span>
                                {lessonSlide.teacherNote}
                              </p>
                            )
                          ) : null}
                        </div>
                      </section>
                    ) : null}
                  </>
                ) : null}

                {mode === 'quiz' && quizSlide ? (
                  <>
                    <section className="rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] p-4">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                        {quizSlide.kind === 'answer' ? 'Resposta e explicação' : 'Pergunta'}
                      </h3>
                      <p className="mt-2 text-xl font-black leading-snug text-[var(--ink)]">
                        {quizSlide.kind === 'question' || quizSlide.kind === 'answer'
                          ? quizSlide.question
                          : ''}
                      </p>
                      {quizSlide.kind === 'answer' ? (
                        <>
                          <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                            Correta
                          </p>
                          <p className="text-lg font-black text-[var(--accent-2)]">
                            {quizSlide.options[quizSlide.correctIndex]}
                          </p>
                          {quizSlide.explanation ? (
                            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                              {quizSlide.explanation}
                            </p>
                          ) : null}
                        </>
                      ) : (
                        <p className="mt-3 text-sm font-semibold text-[var(--muted)]">
                          Deixe a turma responder em voz alta. Use <span className="font-black">→</span>{' '}
                          para revelar a resposta.
                        </p>
                      )}
                    </section>
                    <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)]/50 px-4 py-3 text-xs font-semibold text-[var(--muted)]">
                      Baralho fixo da aula: {deck?.questions.length ?? quizTotal / 2} perguntas ·{' '}
                      {quizTotal} slides.
                    </div>
                  </>
                ) : null}
              </div>

              {/* Scene image + slide preview */}
              <div className="min-w-0 space-y-3">
                {showImageControl ? (
                  <section className="rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)]/70 p-3">
                    <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                      <ImageIcon className="h-4 w-4" aria-hidden="true" />
                      {isFlashSlide ? 'Imagem do slide' : 'Imagem da cena'}
                    </h3>
                    <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
                      {isFlashSlide
                        ? `Cole o link de uma imagem (ex.: do Google Imagens). O telão mostra por ${flashSlideSeconds}s e esconde até você avançar — nada é enviado ao servidor.`
                        : 'Cole o link de uma imagem (ex.: do Google Imagens). O telão só renderiza o link — nada é enviado ao servidor.'}
                    </p>
                    <form
                      onSubmit={(event) => {
                        event.preventDefault();
                        applySceneImage(imageInput);
                      }}
                      className="mt-2 flex flex-col gap-2 sm:flex-row"
                    >
                      <input
                        type="url"
                        value={imageInput}
                        onChange={(event) => setImageInput(event.target.value)}
                        placeholder="https://…"
                        aria-label={
                          isFlashSlide ? 'URL da imagem do slide' : 'URL da imagem da cena'
                        }
                        className="min-w-0 flex-1 rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold text-[var(--ink)] outline-none placeholder:text-[var(--muted)] focus:border-[var(--accent)]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
                        >
                          Mostrar na TV
                        </button>
                        <button
                          type="button"
                          onClick={() => applySceneImage('')}
                          className="rounded-xl border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
                        >
                          Limpar
                        </button>
                      </div>
                    </form>
                    <p className="mt-2 text-[11px] font-semibold text-[var(--muted)]">
                      {imageUrls[beatIndex]
                        ? isFlashSlide
                          ? `Imagem ativa neste beat: o telão mostra por ${flashSlideSeconds}s a cada vez que o slide entra.`
                          : 'Imagem ativa neste beat. Ela acompanha o slide ao navegar.'
                        : 'Nenhuma imagem neste beat.'}
                    </p>
                  </section>
                ) : null}

                <div className="w-full overflow-hidden rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)]">
                  {currentSlide ? (
                    <SlideStage
                      slide={currentSlide}
                      imageUrl={mode === 'lesson' ? imageUrls[beatIndex] : undefined}
                    />
                  ) : null}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[var(--line-soft)] pt-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={currentIndex <= 0}
                aria-label="Slide anterior"
                className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-black text-[var(--ink)] transition hover:border-[var(--accent)] disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                Anterior
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={currentIndex >= totalItems - 1}
                aria-label="Próximo slide"
                className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-black text-[var(--ink)] transition hover:border-[var(--accent)] disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </button>

              <span className="px-1 text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
                {mode === 'quiz' ? 'Slide' : 'Beat'} {Math.min(currentIndex + 1, totalItems)} de{' '}
                {totalItems}
              </span>

              {beat?.segmentId === 'quiz' ? (
                <button
                  type="button"
                  onClick={openQuizModal}
                  className="ml-auto flex items-center gap-2 rounded-xl bg-[var(--cta-bg)] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-[var(--cta-text)]"
                >
                  <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                  Abrir sala do quiz
                </button>
              ) : null}
            </div>
          </section>
        </div>
      </div>

      {/* Quiz setup modal */}
      {quizModalOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 p-3 sm:items-center sm:p-6"
          onClick={() => setQuizModalOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="aula-quiz-title"
            onClick={(event) => event.stopPropagation()}
            className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-2xl sm:p-6"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                  Quiz da aula
                </p>
                <h2 id="aula-quiz-title" className="mt-1 text-2xl font-black leading-tight">
                  Abrir sala do quiz
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setQuizModalOpen(false)}
                aria-label="Fechar configuração do quiz"
                className="rounded-full border-2 border-[var(--line)] bg-[var(--surface-2)] p-1.5 text-[var(--muted)]"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
              <p className="text-sm font-black text-[var(--ink)]">
                {deck?.questions.length ?? 12} perguntas · {deck?.title ?? activeLesson.title}
              </p>
              <p className="mt-0.5 text-[11px] font-semibold text-[var(--muted)]">
                Baralho fixo da aula, em português. Tempo de cada pergunta, auto-avanço e uso de
                celulares são os únicos ajustes.
              </p>
            </div>

            <fieldset className="mt-5">
              <legend className="text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                Tempo por pergunta
              </legend>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {QUIZ_SECONDS.map((value) => (
                  <button
                    key={value}
                    type="button"
                    aria-pressed={seconds === value}
                    onClick={() => setSeconds(value)}
                    className={
                      seconds === value
                        ? 'rounded-xl border-2 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--ink)]'
                        : 'rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2.5 text-sm font-black text-[var(--muted)] transition hover:border-[var(--line)]'
                    }
                  >
                    {value}s
                  </button>
                ))}
              </div>
            </fieldset>

            <div className="mt-4 flex items-center justify-between gap-4 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
              <div>
                <p className="text-sm font-black">Auto-avanço</p>
                <p className="text-[11px] font-semibold text-[var(--muted)]">
                  Avança sozinho após a revelação.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoAdvance}
                aria-label="Auto-avanço do quiz"
                onClick={() => setAutoAdvance((value) => !value)}
                className={
                  autoAdvance
                    ? 'min-w-20 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#071018]'
                    : 'min-w-20 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)]'
                }
              >
                {autoAdvance ? 'Ligado' : 'Desligado'}
              </button>
            </div>

            <div className="mt-3 flex items-center justify-between gap-4 rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
              <div>
                <p className="text-sm font-black">Celulares dos alunos</p>
                <p className="text-[11px] font-semibold text-[var(--muted)]">
                  {usePhones
                    ? 'Abre o /host e os alunos respondem em supp.lol/join.'
                    : 'Quiz conduzido no telão, sem celulares (pergunta + resposta).'}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={usePhones}
                aria-label="Usar celulares dos alunos no quiz"
                onClick={() => setUsePhones((value) => !value)}
                className={
                  usePhones
                    ? 'min-w-20 rounded-full bg-[var(--accent)] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#071018]'
                    : 'min-w-20 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)]'
                }
              >
                {usePhones ? 'Ligado' : 'Desligado'}
              </button>
            </div>

            <button
              type="button"
              onClick={startQuiz}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              {usePhones ? (
                <Users className="h-5 w-5" aria-hidden="true" />
              ) : (
                <Presentation className="h-5 w-5" aria-hidden="true" />
              )}
              {usePhones ? 'Abrir sala no /host' : 'Iniciar quiz na apresentação'}
            </button>

            <p className="mt-3 text-[11px] font-semibold text-[var(--muted)]">
              {usePhones
                ? 'O telão entra em modo espectador do Live e mostra perguntas, respostas e ranking.'
                : 'O telão passa a mostrar 24 slides gerados do baralho: pergunta e resposta.'}
            </p>
          </div>
        </div>
      ) : null}
      {warmupModalView}
    </main>
  );
}
