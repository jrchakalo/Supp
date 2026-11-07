'use client';

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  ExternalLink,
  Gamepad2,
  Image as ImageIcon,
  KeyRound,
  LogOut,
  MonitorPlay,
  Presentation,
  Radio,
  Users,
  X,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SlideView from '@/components/aula/SlideView';
import { QUIZ_LESSON_ID, buildQuizSlides } from '@/components/aula/quizSlides';
import { flattenBeats, type Lesson, type Slide } from '@/lib/passaporte-lessons';
import { fetchLessons } from '@/lib/aula/lessons';
import { PASSAPORTE_DECKS } from '@/lib/passaporte-decks';
import { randomRoomCode, sanitizeRoomCode } from '@/lib/live/room';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';
import {
  AULA_GATE_STORAGE,
  AULA_SESSION_STORAGE,
  AULA_WELCOME_FALLBACK,
  PASSAPORTE_GATE_CODE,
  createAulaChannel,
  type AulaChannel,
  type AulaConnectionStatus,
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

  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
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

  useEffect(() => {
    activeLessonRef.current = activeLesson;
    beatIndexRef.current = beatIndex;
    quizIndexRef.current = quizIndex;
    modeRef.current = mode;
    phaseRef.current = phase;
    imageUrlsRef.current = imageUrls;
    liveQuizRef.current = liveQuizCode;
  }, [activeLesson, beatIndex, quizIndex, imageUrls, liveQuizCode, mode, phase]);

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
        phase?: unknown;
        images?: unknown;
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
      setTvUrl(`${window.location.origin}/tv?c=${code}`);
      if (savedQuiz) {
        setLiveQuizCode(savedQuiz);
        setHostUrl(
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
        phase,
        images: imageUrls,
      })
    );
  }, [activeLesson, sessionCode, beatIndex, liveQuizCode, phase, imageUrls]);

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
        if (!active || message.type !== 'hello') return;
        syncTv();
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

  /* ------------------------------------------------------------------ */
  /* Navigation                                                          */
  /* ------------------------------------------------------------------ */

  const broadcast = useCallback((message: AulaMessage) => {
    channelRef.current?.send(message);
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
      modeRef.current = 'lesson';
      liveQuizRef.current = null;
      beatIndexRef.current = next;
      setMode('lesson');
      setLiveQuizCode(null);
      setHostUrl('');
      setBeatIndex(next);
      setImageInput(imageUrlsRef.current[next] ?? '');
      broadcast({ type: 'quizEnd' });
      broadcast({ type: 'slide', lessonId: lesson.id, index: next, slide, imageUrl });
    },
    [broadcast]
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
      broadcast({ type: 'slide', lessonId: QUIZ_LESSON_ID, index: next, slide });
    },
    [broadcast]
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

  const backToLessonSlides = useCallback(() => {
    const lesson = activeLessonRef.current;
    if (!lesson) return;
    const slide = flattenBeats(lesson)[beatIndexRef.current]?.slide;

    modeRef.current = 'lesson';
    liveQuizRef.current = null;
    broadcast({ type: 'quizEnd' });
    setLiveQuizCode(null);
    setHostUrl('');
    setMode('lesson');
    if (slide) {
      broadcast({
        type: 'slide',
        lessonId: lesson.id,
        index: beatIndexRef.current,
        slide,
        imageUrl: imageUrlsRef.current[beatIndexRef.current],
      });
    }
  }, [broadcast]);

  useEffect(() => {
    if (!activeLesson || quizModalOpen) return;

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
  }, [activeLesson, goNext, goPrev, quizModalOpen]);

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
    setTvUrl(`${window.location.origin}/tv?c=${code}`);
  }, []);

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
    removeStorage(AULA_SESSION_STORAGE);
    activeLessonRef.current = null;
    beatIndexRef.current = 0;
    quizIndexRef.current = 0;
    modeRef.current = 'lesson';
    phaseRef.current = 'welcome';
    imageUrlsRef.current = {};
    liveQuizRef.current = null;
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
  }, []);

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
      modeRef.current = 'lesson';
      quizIndexRef.current = 0;
      setMode('lesson');
      setQuizIndex(0);
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
  }, [autoAdvance, broadcast, seconds, sessionCode, usePhones]);

  useEffect(() => {
    if (!quizModalOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setQuizModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [quizModalOpen]);

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
    return (
      <main className="theme-dark game-shell min-h-dvh px-4 py-6 text-[var(--ink)] sm:px-8">
        <div className="mx-auto w-full max-w-5xl">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                Supp · Aulas
              </p>
              <h1 className="mt-1 text-3xl font-black tracking-tight sm:text-4xl">
                Escolha a aula de hoje
              </h1>
            </div>
            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-2 rounded-full border-2 border-[var(--line)] bg-[var(--surface)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:border-[var(--danger)] hover:text-[var(--danger)]"
            >
              <LogOut className="h-4 w-4" aria-hidden="true" />
              Sair
            </button>
          </header>

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
            <section className="mt-6 grid gap-4 sm:grid-cols-2">
              {(lessons ?? []).map((lesson) => {
                const isToday = today !== '' && lesson.date === today;
                return (
                  <article
                    key={lesson.id}
                    className="flex flex-col rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 shadow-[var(--panel-shadow)]"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      {isToday ? (
                        <span className="rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.16em] text-[#071018]">
                          Aula de hoje
                        </span>
                      ) : null}
                      <span className="rounded-full border border-[var(--line-soft)] px-2.5 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--muted)]">
                        {formatLessonDate(lesson.date)}
                      </span>
                    </div>

                    <h2 className="mt-3 text-xl font-black leading-tight">{lesson.title}</h2>
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
            </section>
          )}

          <p className="mt-6 text-xs font-semibold text-[var(--muted)]">
            Ao iniciar, o Supp gera um código de sessão e a URL do telão. O projetor abre
            <span className="font-black text-[var(--ink)]"> /tv</span> e acompanha cada slide.
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
                Voltar aos slides da aula
              </button>
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
                            <p className="rounded-xl border-l-4 border-[var(--accent-2)] bg-[var(--surface)] px-3 py-2 text-sm font-semibold leading-snug text-[var(--ink)]">
                              <span className="mr-2 text-[10px] font-black uppercase tracking-[0.14em] text-[var(--accent-2)]">
                                Só para você
                              </span>
                              {lessonSlide.teacherNote}
                            </p>
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
                {mode === 'lesson' && segment?.id === 'cena' ? (
                  <section className="rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)]/70 p-3">
                    <h3 className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
                      <ImageIcon className="h-4 w-4" aria-hidden="true" />
                      Imagem da cena
                    </h3>
                    <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
                      Cole o link de uma imagem (ex.: do Google Imagens). O telão só renderiza o
                      link — nada é enviado ao servidor.
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
                        aria-label="URL da imagem da cena"
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
                        ? 'Imagem ativa neste beat. Ela acompanha o slide ao navegar.'
                        : 'Nenhuma imagem neste beat.'}
                    </p>
                  </section>
                ) : null}

                <div className="max-h-[clamp(18rem,72vh,46rem)] w-full overflow-y-auto rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)]">
                  {currentSlide ? (
                    <SlideView
                      slide={currentSlide}
                      variant="preview"
                      imageUrl={mode === 'lesson' ? imageUrls[beatIndex] : undefined}
                      className="min-h-[clamp(14rem,40vh,28rem)]"
                    />
                  ) : null}
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--muted)]">
                  <MonitorPlay className="h-3.5 w-3.5" aria-hidden="true" />
                  Prévia do telão — é este slide que os alunos veem em /tv.
                </p>
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

              <button
                type="button"
                onClick={openQuizModal}
                className="ml-auto flex items-center gap-2 rounded-xl bg-[var(--cta-bg)] px-4 py-2.5 text-sm font-black uppercase tracking-wide text-[var(--cta-text)]"
              >
                <Gamepad2 className="h-4 w-4" aria-hidden="true" />
                Abrir sala do quiz
              </button>
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
    </main>
  );
}
