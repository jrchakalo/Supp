'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Maximize,
  Minimize,
  MonitorPlay,
  Timer,
  Trophy,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import SlideView from '@/components/aula/SlideView';
import type { Slide } from '@/lib/passaporte-lessons';
import { ANSWER_BUTTONS, sanitizeRoomCode } from '@/lib/live/room';
import {
  channelNameFor,
  type HostToPlayerMessage,
  type LiveScoreRow,
  type QuestionStartMessage,
  type RevealMessage,
} from '@/lib/live/protocol';
import { getSupabaseClient } from '@/lib/live/supabase';
import { readStorage, removeStorage, writeStorage } from '@/lib/storage';
import {
  AULA_WELCOME_FALLBACK,
  createAulaChannel,
  type AulaChannel,
  type AulaCompMessage,
  type AulaCompScore,
  type AulaConnectionStatus,
  type AulaD20Message,
  type AulaMessage,
  type AulaWelcomeContent,
} from '@/lib/aula/sync';

type LivePhase = 'lobby' | 'question' | 'reveal' | 'gameover';
type LiveConnection = 'idle' | 'connecting' | 'connected' | 'error';

/** localStorage snapshot of the last quiz state, for F5 recovery on the TV. */
const TV_QUIZ_STORAGE = 'tv-quiz';
const TV_QUIZ_TTL_MS = 10 * 60 * 1000;

type SavedQuizState = {
  code: string;
  mode: 'question' | 'reveal' | 'gameover';
  payload: HostToPlayerMessage;
  savedAt: number;
};

function readSavedQuizState(code: string): SavedQuizState | null {
  if (!code) return null;
  const raw = readStorage(TV_QUIZ_STORAGE);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<SavedQuizState>;
    if (
      typeof parsed.code !== 'string' ||
      parsed.code !== code ||
      typeof parsed.savedAt !== 'number' ||
      !parsed.payload ||
      typeof parsed.payload !== 'object' ||
      (parsed.mode !== 'question' && parsed.mode !== 'reveal' && parsed.mode !== 'gameover')
    ) {
      return null;
    }
    if (Date.now() - parsed.savedAt > TV_QUIZ_TTL_MS) {
      removeStorage(TV_QUIZ_STORAGE);
      return null;
    }
    const payload = parsed.payload as HostToPlayerMessage;
    if (payload.kind !== parsed.mode) return null;
    return {
      code: parsed.code,
      mode: parsed.mode,
      payload,
      savedAt: parsed.savedAt,
    };
  } catch {
    return null;
  }
}

function saveQuizState(state: SavedQuizState) {
  writeStorage(TV_QUIZ_STORAGE, JSON.stringify(state));
}

function clearSavedQuizState() {
  removeStorage(TV_QUIZ_STORAGE);
}

function ConnectionPill({
  status,
  label = 'conexão',
}: {
  status: AulaConnectionStatus | LiveConnection;
  label?: string;
}) {
  const meta =
    status === 'connected'
      ? { dot: 'bg-emerald-400', text: 'conectado' }
      : status === 'connecting'
        ? { dot: 'bg-amber-400 animate-pulse', text: 'conectando' }
        : status === 'error'
          ? { dot: 'bg-red-400 animate-pulse', text: 'sem conexão' }
          : status === 'offline'
            ? { dot: 'bg-amber-500', text: 'realtime off' }
            : { dot: 'bg-slate-500', text: 'aguardando' };

  return (
    <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)]">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${meta.dot}`} />
      {label}: {meta.text}
    </span>
  );
}

function Podium({ rows, step }: { rows: LiveScoreRow[]; step: number }) {
  const slots = [
    { row: rows[1], place: 2, height: 'h-[clamp(5rem,16vh,10rem)]' },
    { row: rows[0], place: 1, height: 'h-[clamp(7rem,23vh,15rem)]' },
    { row: rows[2], place: 3, height: 'h-[clamp(4rem,12vh,8rem)]' },
  ];

  /* Reveal suspense: 3rd place, then 2nd, then 1st. Missing places are
     skipped so a room with one or two players still reveals nicely. */
  const availablePlaces = [1, 2, 3].filter((place) => Boolean(rows[place - 1]));
  const descending = [...availablePlaces].sort((a, b) => b - a);
  const revealStepFor = (place: number) => descending.indexOf(place) + 1;
  const revealedFor = (place: number) => step >= revealStepFor(place);

  return (
    <div className="flex w-full items-end justify-center gap-3">
      {slots.map((slot) => {
        if (!slot.row) return null;
        const revealed = revealedFor(slot.place);
        return (
          <div
            key={slot.place}
            className={`flex w-full max-w-[15rem] flex-col items-center gap-2 transition-all duration-700 ease-out ${
              revealed
                ? 'translate-y-0 scale-100 opacity-100'
                : 'translate-y-6 scale-90 opacity-0'
            }`}
            aria-hidden={!revealed}
          >
            <span className="text-[clamp(1.5rem,3vw,2.6rem)] font-black text-[var(--accent)]">
              {slot.place}º
            </span>
            <p className="w-full truncate text-center text-[clamp(1rem,1.8vw,1.8rem)] font-black text-[var(--ink)]">
              {slot.row.name}
            </p>
            <div
              className={`flex w-full items-end justify-center rounded-t-2xl border-2 border-b-0 border-[var(--line)] bg-[var(--surface-2)] ${slot.height}`}
            >
              <p className="pb-3 text-[clamp(1rem,2vw,2rem)] font-black text-[var(--ink)]">
                {slot.row.total.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

type LiveSpectatorProps = {
  phase: LivePhase;
  code: string;
  joinUrl: string;
  question: QuestionStartMessage | null;
  reveal: RevealMessage | null;
  gameover: { leaderboard: LiveScoreRow[] } | null;
  secondsLeft: number;
  timeRatio: number;
  connection: LiveConnection;
};

function LiveSpectator({
  phase,
  code,
  joinUrl,
  question,
  reveal,
  gameover,
  secondsLeft,
  timeRatio,
  connection,
}: LiveSpectatorProps) {
  const ranked = [...(reveal?.leaderboard ?? gameover?.leaderboard ?? [])].sort(
    (a, b) => b.total - a.total || a.name.localeCompare(b.name)
  );

  /* Podium reveal state is keyed by the gameover snapshot, so a new game does
     not inherit the previous podium without a synchronous state reset. */
  const [podium, setPodium] = useState<{ key: string; step: number }>({ key: '', step: 0 });
  const podiumPlaces = Math.min(ranked.length, 3);
  const podiumKey =
    gameover?.leaderboard.map((row) => `${row.playerId}:${row.total}`).join(',') ?? '';
  const podiumStep = phase === 'gameover' && podium.key === podiumKey ? podium.step : 0;

  useEffect(() => {
    if (phase !== 'gameover') return;
    const timers = [
      window.setTimeout(() => setPodium({ key: podiumKey, step: 1 }), 700),
      window.setTimeout(() => setPodium({ key: podiumKey, step: 2 }), 1600),
      window.setTimeout(() => setPodium({ key: podiumKey, step: 3 }), 2500),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [phase, podiumKey]);

  /* Fire confetti the moment the winner (1st place) is revealed. The same
     spectator view is used by the in-class quiz and by the Live room. */
  useEffect(() => {
    if (phase !== 'gameover' || podiumPlaces === 0 || podiumStep < podiumPlaces) return;
    const common = {
      colors: ['#f59e0b', '#22d3ee', '#a78bfa', '#34d399', '#f472b6'],
      disableForReducedMotion: true,
    };
    confetti({ ...common, particleCount: 120, spread: 80, origin: { y: 0.62 } });
    confetti({ ...common, particleCount: 60, angle: 55, spread: 55, origin: { x: 0, y: 0.7 } });
    confetti({ ...common, particleCount: 60, angle: 125, spread: 55, origin: { x: 1, y: 0.7 } });
  }, [phase, podiumStep, podiumPlaces]);

  if (phase === 'question' && question) {
    return (
      <div className="flex h-full min-h-0 flex-col p-4 sm:p-6">
        <div className="flex shrink-0 items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[clamp(0.9rem,1.4vw,1.3rem)] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
            <Users className="h-[1.2em] w-[1.2em]" aria-hidden="true" />
            Quiz ao vivo · sala {code}
          </div>
          <div className="flex items-center gap-2">
            <Timer className="h-[1.4em] w-[1.4em] text-[var(--accent-2)]" aria-hidden="true" />
            <span className="text-[clamp(1.6rem,3.2vw,3rem)] font-black leading-none text-[var(--ink)]">
              {secondsLeft}s
            </span>
          </div>
        </div>

        <div className="mt-2 h-2.5 shrink-0 overflow-hidden rounded-full bg-[var(--surface-2)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
            style={{ width: `${Math.max(0, Math.min(1, timeRatio)) * 100}%` }}
          />
        </div>

        <h1 className="mt-[clamp(0.6rem,1.5vh,1.4rem)] text-center text-[clamp(1.5rem,3.3vw,3.4rem)] font-black leading-tight text-balance text-[var(--ink)]">
          {question.text}
        </h1>

        <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-2 sm:gap-3">
          {question.options.map((option, index) => {
            const style = ANSWER_BUTTONS[index % ANSWER_BUTTONS.length];
            return (
              <div
                key={option}
                className="flex min-h-0 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-white shadow-[var(--tile-shadow)]"
                style={{ backgroundColor: style.bg }}
              >
                <span
                  aria-hidden="true"
                  className="shrink-0 text-[clamp(1.8rem,3.4vw,3.6rem)]"
                >
                  {style.shape}
                </span>
                <span className="min-w-0 flex-1 text-[clamp(1rem,2.1vw,2.3rem)] font-black leading-tight">
                  {option}
                </span>
              </div>
            );
          })}
        </div>

        <p className="mt-2 shrink-0 text-center text-[clamp(0.8rem,1.3vw,1.1rem)] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
          Responda no celular · supp.lol/join
        </p>
      </div>
    );
  }

  if (phase === 'reveal' && reveal) {
    return (
      <div className="flex h-full min-h-0 flex-col gap-3 overflow-y-auto p-4 sm:p-6">
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-[clamp(0.8rem,1.2vw,1.1rem)] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
            <Trophy className="h-[1.2em] w-[1.2em]" aria-hidden="true" />
            Revelação · sala {code}
          </div>
          <ConnectionPill status={connection} label="live" />
        </div>

        <h1 className="shrink-0 text-[clamp(1.2rem,2.4vw,2.5rem)] font-black leading-tight text-balance text-[var(--ink)]">
          {reveal.text}
        </h1>

        <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1.55fr_1fr]">
          <div className="grid min-h-0 grid-cols-2 gap-2">
            {reveal.options.map((option, index) => {
              const style = ANSWER_BUTTONS[index % ANSWER_BUTTONS.length];
              const correct = index === reveal.correctIndex;
              const count = reveal.counts[index] ?? 0;
              return (
                <div
                  key={option}
                  className={`relative flex min-h-0 items-center gap-3 overflow-hidden rounded-2xl px-4 py-3 text-white ${
                    correct
                      ? 'ring-4 ring-[var(--accent-2)] ring-offset-2 ring-offset-[var(--surface)]'
                      : 'opacity-80'
                  }`}
                  style={{ backgroundColor: style.bg }}
                >
                  <span
                    aria-hidden="true"
                    className="shrink-0 text-[clamp(1.6rem,2.8vw,3rem)]"
                  >
                    {style.shape}
                  </span>
                  <span className="min-w-0 flex-1 text-[clamp(0.9rem,1.8vw,1.9rem)] font-black leading-tight">
                    {option}
                  </span>
                  <span className="shrink-0 rounded-full bg-black/30 px-2 py-0.5 text-[clamp(0.7rem,1.1vw,1rem)] font-black">
                    {count}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex min-h-0 flex-col gap-2">
            {reveal.explanation ? (
              <p className="shrink-0 rounded-xl border-l-4 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-[clamp(0.8rem,1.3vw,1.2rem)] font-semibold text-[var(--ink)]">
                {reveal.explanation}
              </p>
            ) : null}

            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-[var(--line-soft)] bg-[var(--surface-2)]/50 p-3">
              <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
                Top 5
              </p>
              <ol className="mt-1 min-h-0 flex-1 space-y-1 overflow-auto">
                {ranked.slice(0, 5).map((row, index) => (
                  <li
                    key={row.playerId}
                    className="flex items-center gap-2 rounded-lg px-2 py-1 text-[clamp(0.75rem,1.2vw,1.1rem)]"
                  >
                    <span className="w-5 shrink-0 text-right font-black text-[var(--accent)]">
                      {index + 1}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-black text-[var(--ink)]">
                      {row.name}
                    </span>
                    <span className="shrink-0 font-black text-[var(--muted)]">
                      {row.total.toLocaleString('pt-BR')}
                    </span>
                  </li>
                ))}
                {ranked.length === 0 ? (
                  <li className="px-2 py-1 text-xs font-semibold text-[var(--muted)]">
                    Calculando ranking…
                  </li>
                ) : null}
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'gameover') {
    return (
      <div className="flex h-full min-h-0 flex-col items-center gap-3 overflow-y-auto p-4 sm:p-6">
        <div className="shrink-0 text-center">
          <p className="text-[clamp(0.8rem,1.2vw,1.1rem)] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            Fim do quiz · sala {code}
          </p>
          <h1 className="mt-1 text-[clamp(2rem,4vw,4rem)] font-black leading-none text-[var(--ink)]">
            Pódio
          </h1>
        </div>

        <Podium rows={ranked} step={podiumStep} />

        <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)]/50 p-3">
          <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
            Top 10
          </p>
          <ol className="mt-1 min-h-0 flex-1 space-y-1 overflow-auto">
            {ranked.slice(0, 10).map((row, index) => (
              <li
                key={row.playerId}
                className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[clamp(0.8rem,1.3vw,1.2rem)]"
              >
                <span className="w-6 shrink-0 text-right font-black text-[var(--accent)]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-black text-[var(--ink)]">
                  {row.name}
                </span>
                <span className="shrink-0 font-black text-[var(--muted)]">
                  {row.total.toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 overflow-y-auto p-6 text-center">
      <p className="text-[clamp(0.9rem,1.4vw,1.3rem)] font-black uppercase tracking-[0.32em] text-[var(--accent)]">
        Sala do quiz
      </p>
      <p className="text-[clamp(3.4rem,11vw,10rem)] font-black leading-none tracking-[0.12em] text-[var(--ink)]">
        {code}
      </p>
      <h1 className="text-[clamp(1.2rem,2.4vw,2.6rem)] font-black leading-tight text-[var(--ink)]">
        Entre em <span className="text-[var(--accent)]">supp.lol/join</span>
      </h1>

      <div className="mt-1 flex flex-wrap items-center justify-center gap-6">
        {joinUrl ? (
          <div className="rounded-2xl bg-white p-3 shadow-xl">
            <QRCodeSVG value={joinUrl} size={168} fgColor="#0b1020" bgColor="#ffffff" />
          </div>
        ) : null}
        <ol className="space-y-1 text-left text-[clamp(0.85rem,1.4vw,1.25rem)] font-semibold text-[var(--muted)]">
          <li>1 · Abra supp.lol/join no celular</li>
          <li>2 · Digite o código {code}</li>
          <li>3 · Entre com seu nome real</li>
          <li className="pt-1 text-[var(--accent-2)]">Aguarde o professor iniciar…</li>
        </ol>
      </div>
    </div>
  );
}

type WarmupOverlay = 'none' | 'd20' | 'comp';

/** Warm-up D20: statement first, TRUE/FALSE + explanation after the reveal. */
function D20Spectator({
  message,
  revealed,
}: {
  message: AulaD20Message;
  revealed: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center gap-6 p-6 text-center sm:p-10">
      <p className="text-[clamp(0.9rem,1.8vw,1.5rem)] font-black uppercase tracking-[0.28em] text-[var(--accent)]">
        🎲 D20 — True or False?
      </p>
      <h1 className="max-w-6xl text-balance text-[clamp(1.8rem,4.2vw,4.6rem)] font-black leading-tight text-[var(--ink)]">
        {message.text}
      </h1>

      {revealed ? (
        <div className="flex max-w-5xl flex-col items-center gap-4">
          <p
            className={`text-[clamp(3rem,10vw,9rem)] font-black leading-none ${
              message.answer ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {message.answer ? 'TRUE' : 'FALSE'}
          </p>
          {message.explanation ? (
            <p className="rounded-2xl border-l-4 border-[var(--accent)] bg-[var(--surface-2)] px-4 py-3 text-[clamp(0.95rem,1.7vw,1.5rem)] font-semibold leading-snug text-[var(--ink)]">
              {message.explanation}
            </p>
          ) : null}
        </div>
      ) : (
        <p className="text-[clamp(1rem,1.8vw,1.6rem)] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
          A turma responde: TRUE ou FALSE
        </p>
      )}
    </div>
  );
}

/** Final competition view: same podium language as the Live quiz. */
function CompPodium({ ranking }: { ranking: AulaCompScore[] }) {
  const rows: LiveScoreRow[] = ranking.map((row, index) => ({
    playerId: `comp-${index}-${row.name}`,
    name: row.name,
    total: row.score,
    streak: 0,
    gained: 0,
    correct: false,
  }));

  useEffect(() => {
    const common = {
      colors: ['#f59e0b', '#22d3ee', '#a78bfa', '#34d399', '#f472b6'],
      disableForReducedMotion: true,
    };
    confetti({ ...common, particleCount: 120, spread: 80, origin: { y: 0.62 } });
    confetti({ ...common, particleCount: 60, angle: 55, spread: 55, origin: { x: 0, y: 0.7 } });
    confetti({ ...common, particleCount: 60, angle: 125, spread: 55, origin: { x: 1, y: 0.7 } });
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col items-center gap-3 overflow-y-auto p-4 sm:p-6">
      <div className="shrink-0 text-center">
        <p className="text-[clamp(0.8rem,1.2vw,1.1rem)] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
          Fim da competição
        </p>
        <h1 className="mt-1 text-[clamp(2rem,4vw,4rem)] font-black leading-none text-[var(--ink)]">
          Pódio
        </h1>
      </div>

      <Podium rows={rows} step={3} />

      <div className="flex min-h-0 w-full max-w-3xl flex-1 flex-col rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)]/50 p-3">
        <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
          Placar final
        </p>
        <ol className="mt-1 min-h-0 flex-1 space-y-1 overflow-auto">
          {rows.slice(0, 10).map((row, index) => (
            <li
              key={row.playerId}
              className="flex items-center gap-3 rounded-lg px-2 py-1.5 text-[clamp(0.8rem,1.3vw,1.2rem)]"
            >
              <span className="w-6 shrink-0 text-right font-black text-[var(--accent)]">
                {index + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-black text-[var(--ink)]">
                {row.name}
              </span>
              <span className="shrink-0 font-black text-[var(--muted)]">
                {row.total.toLocaleString('pt-BR')}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

/** Warm-up competition: statement on the left, live scoreboard on the right. */
function CompSpectator({
  message,
  ranking,
}: {
  message: AulaCompMessage;
  ranking: AulaCompScore[] | null;
}) {
  if (ranking) return <CompPodium ranking={ranking} />;

  const scores = [...message.scores].sort(
    (a, b) => b.score - a.score || a.name.localeCompare(b.name)
  );

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 p-4 sm:p-6">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[clamp(0.85rem,1.4vw,1.25rem)] font-black uppercase tracking-[0.2em] text-[var(--accent)]">
          <Trophy className="h-[1.2em] w-[1.2em]" aria-hidden="true" />
          Competição da turma
        </div>
        {message.round && message.totalRounds ? (
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1 text-[clamp(0.7rem,1.1vw,1rem)] font-black uppercase tracking-wide text-[var(--muted)]">
            Rodada {message.round} de {message.totalRounds}
          </span>
        ) : null}
      </div>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[1.65fr_1fr]">
        <div className="flex min-h-0 flex-col justify-center gap-4 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-5 text-center">
          <p className="text-[clamp(1rem,2vw,1.8rem)] font-black uppercase tracking-[0.2em] text-[var(--accent-2)]">
            {message.student}
          </p>
          <h1 className="text-balance text-[clamp(1.4rem,3vw,3rem)] font-black leading-tight text-[var(--ink)]">
            {message.text}
          </h1>

          {message.revealed ? (
            <>
              <p
                className={`text-[clamp(2.2rem,6vw,5.5rem)] font-black leading-none ${
                  message.answer ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {message.answer ? 'TRUE' : 'FALSE'}
              </p>
              {message.explanation ? (
                <p className="mx-auto max-w-3xl rounded-xl border-l-4 border-[var(--accent)] bg-[var(--surface-2)] px-3 py-2 text-[clamp(0.8rem,1.3vw,1.2rem)] font-semibold text-[var(--ink)]">
                  {message.explanation}
                </p>
              ) : null}
            </>
          ) : (
            <p className="text-[clamp(0.9rem,1.5vw,1.3rem)] font-black uppercase tracking-[0.18em] text-[var(--muted)]">
              Responda: TRUE ou FALSE
            </p>
          )}
        </div>

        <div className="flex min-h-0 flex-col rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)]/50 p-3">
          <p className="shrink-0 text-[10px] font-black uppercase tracking-[0.2em] text-[var(--muted)]">
            Placar
          </p>
          <ol className="mt-1 min-h-0 flex-1 space-y-1 overflow-auto">
            {scores.map((row, index) => (
              <li
                key={row.name}
                className={`flex items-center gap-2 rounded-lg px-2 py-1 text-[clamp(0.8rem,1.3vw,1.2rem)] ${
                  row.name === message.student ? 'bg-[var(--surface)]' : ''
                }`}
              >
                <span className="w-5 shrink-0 text-right font-black text-[var(--accent)]">
                  {index + 1}
                </span>
                <span className="min-w-0 flex-1 truncate font-black text-[var(--ink)]">
                  {row.name}
                </span>
                <span className="shrink-0 font-black text-[var(--muted)]">{row.score}</span>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  );
}

export default function TvPage() {
  const [mounted, setMounted] = useState(false);
  const [origin, setOrigin] = useState('');
  const [code, setCode] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [nonce, setNonce] = useState(0);

  const [connection, setConnection] = useState<AulaConnectionStatus>('idle');
  const [realtimeMissing, setRealtimeMissing] = useState(false);
  const [slide, setSlide] = useState<Slide | null>(null);
  const [slideImage, setSlideImage] = useState<string | undefined>(undefined);
  const [slideKey, setSlideKey] = useState(0);
  /** Welcome stays on until the teacher starts (or explicitly leaves welcome). */
  const [welcome, setWelcome] = useState(true);
  /** Lesson-provided welcome copy (falls back to the generic messages). */
  const [welcomeContent, setWelcomeContent] = useState<AulaWelcomeContent | null>(null);
  /** Longer fade + zoom when leaving the welcome screen for the first slide. */
  const [longEnter, setLongEnter] = useState(false);

  const [quizRoom, setQuizRoom] = useState<string | null>(null);
  const [quizConnection, setQuizConnection] = useState<LiveConnection>('idle');
  const [livePhase, setLivePhase] = useState<LivePhase>('lobby');
  const [liveQuestion, setLiveQuestion] = useState<QuestionStartMessage | null>(null);
  const [liveReveal, setLiveReveal] = useState<RevealMessage | null>(null);
  const [liveGameover, setLiveGameover] = useState<{ leaderboard: LiveScoreRow[] } | null>(null);
  const [clock, setClock] = useState(0);

  /* Warm-ups own the screen while active: the teacher's slides are ignored. */
  const [warmup, setWarmup] = useState<WarmupOverlay>('none');
  const [d20, setD20] = useState<AulaD20Message | null>(null);
  const [d20Revealed, setD20Revealed] = useState(false);
  const [comp, setComp] = useState<AulaCompMessage | null>(null);
  const [compRanking, setCompRanking] = useState<AulaCompScore[] | null>(null);

  const [isFullscreen, setIsFullscreen] = useState(false);

  const aulaChannelRef = useRef<AulaChannel | null>(null);
  const quizRoomRef = useRef<string | null>(null);
  const welcomeRef = useRef(true);
  /** Keeps the long animation across the back-to-back `state` + `slide` pair. */
  const longEnterUntilRef = useRef(0);
  /* Generated inside the channel effect (not during render) to stay pure. */
  const tvPresenceIdRef = useRef('');
  const warmupRef = useRef<WarmupOverlay>('none');
  /* The teacher's presence: after seeing them once, 4 s of absence boots us. */
  const teacherSeenRef = useRef(false);
  const teacherAbsenceRef = useRef<number | null>(null);

  useEffect(() => {
    quizRoomRef.current = quizRoom;
  }, [quizRoom]);

  useEffect(() => {
    warmupRef.current = warmup;
  }, [warmup]);

  const applySlide = useCallback((next: Slide, imageUrl?: string) => {
    if (welcomeRef.current) {
      welcomeRef.current = false;
      longEnterUntilRef.current = Date.now() + 1400;
    }
    setLongEnter(Date.now() < longEnterUntilRef.current);
    setSlide(next);
    setSlideImage(imageUrl);
    setSlideKey((value) => value + 1);
    setWelcome(false);
  }, []);

  const showWelcome = useCallback(() => {
    welcomeRef.current = true;
    longEnterUntilRef.current = 0;
    setLongEnter(false);
    setWelcome(true);
    setSlide(null);
    setSlideImage(undefined);
  }, []);

  const forgetLive = useCallback(() => {
    setLivePhase('lobby');
    setLiveQuestion(null);
    setLiveReveal(null);
    setLiveGameover(null);
    setClock(0);
  }, []);

  const resetWarmup = useCallback(() => {
    warmupRef.current = 'none';
    setWarmup('none');
    setD20(null);
    setD20Revealed(false);
    setComp(null);
    setCompRanking(null);
  }, []);

  /** Back to the initial code screen, zeroing every game/slide state. */
  const returnToConnect = useCallback(() => {
    if (teacherAbsenceRef.current) {
      window.clearTimeout(teacherAbsenceRef.current);
      teacherAbsenceRef.current = null;
    }
    teacherSeenRef.current = false;
    clearSavedQuizState();
    quizRoomRef.current = null;
    setQuizRoom(null);
    forgetLive();
    resetWarmup();
    setWelcomeContent(null);
    showWelcome();
    setConnection('idle');
    setCode('');
    setCodeInput('');
    setCodeError('');

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('c');
      url.searchParams.delete('code');
      window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    }
  }, [forgetLive, resetWarmup, showWelcome]);

  const handleAulaMessage = useCallback(
    (message: AulaMessage) => {
      if (message.type === 'end') {
        returnToConnect();
        return;
      }

      if (message.type === 'd20') {
        clearSavedQuizState();
        quizRoomRef.current = null;
        setQuizRoom(null);
        forgetLive();
        warmupRef.current = 'd20';
        setWarmup('d20');
        setD20(message);
        setD20Revealed(false);
        setComp(null);
        setCompRanking(null);
        welcomeRef.current = false;
        setLongEnter(false);
        setWelcome(false);
        setSlide(null);
        setSlideImage(undefined);
        return;
      }

      if (message.type === 'd20Reveal') {
        if (warmupRef.current === 'd20') setD20Revealed(true);
        return;
      }

      if (message.type === 'warmupEnd') {
        resetWarmup();
        return;
      }

      if (message.type === 'comp') {
        clearSavedQuizState();
        quizRoomRef.current = null;
        setQuizRoom(null);
        forgetLive();
        warmupRef.current = 'comp';
        setWarmup('comp');
        setComp(message);
        setCompRanking(null);
        setD20(null);
        setD20Revealed(false);
        welcomeRef.current = false;
        setLongEnter(false);
        setWelcome(false);
        setSlide(null);
        setSlideImage(undefined);
        return;
      }

      if (message.type === 'compEnd') {
        if (warmupRef.current === 'comp') setCompRanking(message.ranking);
        return;
      }

      /* Slides/welcome never interrupt an active D20 or competition. */
      if (
        warmupRef.current !== 'none' &&
        (message.type === 'welcome' || message.type === 'slide' || message.type === 'state')
      ) {
        return;
      }

      /* A restored quiz snapshot (after an F5) wins over the teacher hello:
         slides/welcome must not pull the projector out of a running quiz. */
      const quizActive = quizRoomRef.current !== null;

      if (message.type === 'welcome') {
        if (quizActive) return;
        if (message.welcome) setWelcomeContent(message.welcome);
        quizRoomRef.current = null;
        setQuizRoom(null);
        forgetLive();
        showWelcome();
        return;
      }

      if (message.type === 'slide') {
        if (quizActive) return;
        quizRoomRef.current = null;
        setQuizRoom(null);
        applySlide(message.slide, message.imageUrl);
        return;
      }

      if (message.type === 'quiz') {
        resetWarmup();
        clearSavedQuizState();
        forgetLive();
        welcomeRef.current = false;
        setLongEnter(false);
        setWelcome(false);
        setSlide(null);
        setSlideImage(undefined);
        quizRoomRef.current = message.code;
        setQuizRoom(message.code);
        return;
      }

      if (message.type === 'quizEnd') {
        /* The teacher left the quiz: the saved snapshot is no longer valid. */
        clearSavedQuizState();
        quizRoomRef.current = null;
        setQuizRoom(null);
        forgetLive();
        return;
      }

      if (message.type === 'state') {
        applySlide(message.slide, message.imageUrl);
        if (message.quiz) {
          if (quizRoomRef.current !== message.quiz) forgetLive();
          quizRoomRef.current = message.quiz;
          setQuizRoom(message.quiz);
        } else {
          /* The aula channel says the quiz ended: clear the F5 snapshot. */
          if (quizRoomRef.current) {
            clearSavedQuizState();
            forgetLive();
          }
          quizRoomRef.current = null;
          setQuizRoom(null);
        }
      }
    },
    [applySlide, forgetLive, resetWarmup, returnToConnect, showWelcome]
  );

  const handleLiveMessage = useCallback((message: HostToPlayerMessage) => {
    switch (message.kind) {
      case 'lobby':
        clearSavedQuizState();
        setLivePhase('lobby');
        setLiveQuestion(null);
        setLiveReveal(null);
        setLiveGameover(null);
        break;
      case 'question':
        setLiveQuestion(message);
        setLiveReveal(null);
        setLiveGameover(null);
        setClock(Date.now());
        setLivePhase('question');
        if (quizRoomRef.current) {
          saveQuizState({
            code: quizRoomRef.current,
            mode: 'question',
            payload: message,
            savedAt: Date.now(),
          });
        }
        break;
      case 'reveal':
        setLiveReveal(message);
        setLivePhase('reveal');
        if (quizRoomRef.current) {
          saveQuizState({
            code: quizRoomRef.current,
            mode: 'reveal',
            payload: message,
            savedAt: Date.now(),
          });
        }
        break;
      case 'gameover':
        clearSavedQuizState();
        setLiveGameover({ leaderboard: message.leaderboard });
        setLivePhase('gameover');
        break;
      case 'roomclosed':
        clearSavedQuizState();
        quizRoomRef.current = null;
        setQuizRoom(null);
        break;
    }
  }, []);

  /**
   * Restores the last quiz snapshot after a projector refresh. Only the same
   * room and snapshots younger than 10 minutes are accepted; the countdown is
   * recomputed from `startedAt + timeoutMs`, so it never restarts from zero.
   */
  const restoreQuizState = useCallback((sessionCode: string) => {
    const saved = readSavedQuizState(sessionCode);
    if (!saved) return;

    quizRoomRef.current = saved.code;
    setQuizRoom(saved.code);
    welcomeRef.current = false;
    setWelcome(false);

    const payload = saved.payload;
    if (payload.kind === 'question') {
      setLiveQuestion(payload);
      setLiveReveal(null);
      setLiveGameover(null);
      setClock(Date.now());
      setLivePhase('question');
      return;
    }
    if (payload.kind === 'reveal') {
      setLiveReveal(payload);
      setLiveQuestion(null);
      setLiveGameover(null);
      setLivePhase('reveal');
      return;
    }
    if (payload.kind === 'gameover') {
      setLiveGameover({ leaderboard: payload.leaderboard });
      setLiveQuestion(null);
      setLiveReveal(null);
      setLivePhase('gameover');
    }
  }, []);

  /* Boot: read ?c=CODE, watch fullscreen, restore a saved quiz. */
  useEffect(() => {
    setMounted(true);
    setOrigin(window.location.origin);

    const params = new URLSearchParams(window.location.search);
    const initial = sanitizeRoomCode(params.get('c') ?? params.get('code') ?? '');
    if (initial) {
      setCode(initial);
      setCodeInput(initial);
      restoreQuizState(initial);
    }

    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [restoreQuizState]);

  /* Aula channel: slides + quiz switches. */
  useEffect(() => {
    if (!code) return;

    let active = true;
    if (!tvPresenceIdRef.current) {
      tvPresenceIdRef.current = `tv-${Math.random().toString(36).slice(2, 10)}`;
    }

    const handle = createAulaChannel(code, {
      onMessage: (message) => {
        if (active) handleAulaMessage(message);
      },
      onStatus: (status) => {
        if (!active) return;
        setConnection(status);
        if (status === 'connected') setRealtimeMissing(false);
      },
      onSubscribed: () => {
        if (!active) return;
        setRealtimeMissing(false);
        /* Presence is how `/aula` knows the projector is actually open. */
        aulaChannelRef.current?.track({ role: 'tv', id: tvPresenceIdRef.current });
        aulaChannelRef.current?.send({ type: 'hello' });
      },
      onPresence: (members) => {
        if (!active) return;
        const hasTeacher = members.some((member) => member.role === 'teacher');

        if (hasTeacher) {
          teacherSeenRef.current = true;
          if (teacherAbsenceRef.current) {
            window.clearTimeout(teacherAbsenceRef.current);
            teacherAbsenceRef.current = null;
          }
          return;
        }

        /* Only boot when the teacher was here and just left; the first
           presence snapshot of a fresh tab must not count as absence. */
        if (!teacherSeenRef.current || teacherAbsenceRef.current) return;
        teacherAbsenceRef.current = window.setTimeout(() => {
          teacherAbsenceRef.current = null;
          if (active) returnToConnect();
        }, 4000);
      },
    });

    if (!handle) {
      setRealtimeMissing(true);
      setConnection('offline');
      return;
    }

    aulaChannelRef.current = handle;
    return () => {
      active = false;
      if (teacherAbsenceRef.current) {
        window.clearTimeout(teacherAbsenceRef.current);
        teacherAbsenceRef.current = null;
      }
      handle.remove();
      if (aulaChannelRef.current === handle) aulaChannelRef.current = null;
    };
  }, [code, nonce, handleAulaMessage, returnToConnect]);

  /* Live spectator channel: broadcast only, never presence or answers. */
  useEffect(() => {
    if (!quizRoom) return;

    const client = getSupabaseClient();
    if (!client) {
      setQuizConnection('error');
      return;
    }

    setQuizConnection('connecting');
    let active = true;
    const channel = client.channel(channelNameFor(quizRoom));

    channel
      .on('broadcast', { event: 'host' }, ({ payload }) => {
        if (active) handleLiveMessage(payload as HostToPlayerMessage);
      })
      .subscribe((status) => {
        if (!active) return;
        if (status === 'SUBSCRIBED') setQuizConnection('connected');
        else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setQuizConnection('error');
        }
      });

    return () => {
      active = false;
      void client.removeChannel(channel);
    };
  }, [quizRoom, handleLiveMessage]);

  /* Countdown for the projected question. */
  useEffect(() => {
    if (livePhase !== 'question') return;
    const interval = window.setInterval(() => setClock(Date.now()), 200);
    return () => window.clearInterval(interval);
  }, [livePhase, liveQuestion?.seq]);

  const secondsLeft =
    liveQuestion && clock
      ? Math.max(
          0,
          Math.ceil((liveQuestion.startedAt + liveQuestion.timeoutMs - clock) / 1000)
        )
      : 0;
  const timeRatio =
    liveQuestion && clock
      ? Math.max(
          0,
          Math.min(
            1,
            (liveQuestion.startedAt + liveQuestion.timeoutMs - clock) / liveQuestion.timeoutMs
          )
        )
      : 0;

  const openCode = useCallback(() => {
    const next = sanitizeRoomCode(codeInput);
    if (!next) {
      setCodeError('Digite o código de 5 caracteres que aparece na tela do professor.');
      return;
    }

    setCodeError('');
    setCodeInput(next);
    setWelcomeContent(null);
    showWelcome();
    quizRoomRef.current = null;
    setQuizRoom(null);
    forgetLive();
    resetWarmup();
    teacherSeenRef.current = false;
    if (teacherAbsenceRef.current) {
      window.clearTimeout(teacherAbsenceRef.current);
      teacherAbsenceRef.current = null;
    }

    if (next === code) {
      setNonce((value) => value + 1);
    } else {
      setCode(next);
      const url = new URL(window.location.href);
      url.searchParams.set('c', next);
      window.history.replaceState(null, '', `${url.pathname}${url.search}`);
    }
  }, [code, codeInput, forgetLive, resetWarmup, showWelcome]);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      void document.exitFullscreen?.();
      return;
    }
    void document.documentElement.requestFullscreen?.().catch(() => {
      // Some TV browsers refuse the API; the page still works windowed.
    });
  }, []);

  const joinUrl = quizRoom && origin ? `${origin}/join?code=${quizRoom}` : '';
  const welcomeTitle = welcomeContent?.title || AULA_WELCOME_FALLBACK.title;
  const welcomeMessage = welcomeContent?.message || AULA_WELCOME_FALLBACK.message;
  const welcomeMessage2 = welcomeContent?.message2 || AULA_WELCOME_FALLBACK.message2;

  if (!mounted) {
    return (
      <main className="theme-dark game-shell flex h-dvh items-center justify-center">
        <span className="h-10 w-10 animate-pulse rounded-full bg-[var(--surface-2)]" />
      </main>
    );
  }

  return (
    <main className="theme-dark game-shell relative flex h-dvh flex-col overflow-hidden text-[var(--ink)]">
      {realtimeMissing || connection === 'error' || connection === 'offline' ? (
        <div className="absolute inset-x-0 top-0 z-20 bg-amber-500 px-4 py-2 text-center text-[11px] font-black uppercase tracking-wide text-black">
          {realtimeMissing || connection === 'offline'
            ? 'Realtime indisponível — o telão mantém o último slide e tenta reconectar.'
            : 'Conexão instável — mantendo o último slide e tentando reconectar.'}
        </div>
      ) : null}

      <div className="relative min-h-0 flex-1">
        {!code ? (
          <div className="flex h-full items-center justify-center p-5">
            <section className="w-full max-w-xl rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-7 shadow-[var(--card-shadow)]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--surface-2)] text-[var(--accent)]">
                <MonitorPlay className="h-6 w-6" aria-hidden="true" />
              </span>
              <p className="mt-5 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                supp.lol · telão
              </p>
              <h1 className="mt-1 text-3xl font-black leading-tight sm:text-4xl">Telão da aula</h1>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                Digite o código da sessão que aparece na tela do professor.
              </p>

              <form
                onSubmit={(event) => {
                  event.preventDefault();
                  openCode();
                }}
                className="mt-6"
              >
                <label
                  htmlFor="tv-code"
                  className="block text-[11px] font-black uppercase tracking-[0.18em] text-[var(--muted)]"
                >
                  Código da sessão
                </label>
                <input
                  id="tv-code"
                  value={codeInput}
                  onChange={(event) =>
                    setCodeInput(
                      event.target.value
                        .toUpperCase()
                        .replace(/[^A-Z0-9]/g, '')
                        .slice(0, 6)
                    )
                  }
                  placeholder="ABCDE"
                  autoComplete="off"
                  autoCapitalize="characters"
                  maxLength={6}
                  autoFocus
                  aria-label="Código da sessão do telão"
                  className="mt-2 w-full rounded-2xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-center text-2xl font-black tracking-[0.35em] text-[var(--ink)] outline-none focus:border-[var(--accent)]"
                />
                {codeError ? (
                  <p role="alert" className="mt-3 text-sm font-bold text-[var(--danger)]">
                    {codeError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
                >
                  <MonitorPlay className="h-5 w-5" aria-hidden="true" />
                  Abrir telão
                </button>
              </form>

              <p className="mt-5 text-[11px] font-semibold text-[var(--muted)]">
                O professor abre <span className="font-black text-[var(--ink)]">/aula</span> e inicia
                a aula para gerar este código.
              </p>
            </section>
          </div>
        ) : warmup === 'd20' && d20 ? (
          <D20Spectator message={d20} revealed={d20Revealed} />
        ) : warmup === 'comp' && comp ? (
          <CompSpectator message={comp} ranking={compRanking} />
        ) : quizRoom ? (
          <LiveSpectator
            phase={livePhase}
            code={quizRoom}
            joinUrl={joinUrl}
            question={liveQuestion}
            reveal={liveReveal}
            gameover={liveGameover}
            secondsLeft={secondsLeft}
            timeRatio={timeRatio}
            connection={quizConnection}
          />
        ) : welcome ? (
          <div
            key="welcome"
            className="aula-enter flex h-full flex-col items-center justify-center gap-[clamp(1rem,2.4vw,2rem)] px-6 text-center"
          >
            <p className="text-[clamp(0.9rem,1.4vw,1.3rem)] font-black uppercase tracking-[0.32em] text-[var(--accent)]">
              A aula vai começar!
            </p>
            <h1 className="text-[clamp(3.2rem,9vw,8rem)] font-black leading-none text-[var(--ink)]">
              {welcomeTitle}
            </h1>
            <p className="text-[clamp(1.1rem,2.4vw,2.6rem)] font-bold leading-tight text-balance text-[var(--ink)]">
              {welcomeMessage}
            </p>
            <p className="text-[clamp(0.95rem,1.7vw,1.8rem)] font-semibold leading-tight text-balance text-[var(--muted)]">
              {welcomeMessage2}
            </p>
          </div>
        ) : slide ? (
          <div className="flex h-full w-full items-center justify-center p-3 sm:p-5">
            <div
              /* The key remounts SlideView on every slide/image change, which
                 restarts the `flash` countdown on the TV. */
              key={slideKey}
              className={`${
                longEnter ? 'aula-enter-long' : 'aula-enter'
              } aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-[var(--surface)] shadow-2xl`}
              style={{ maxWidth: 'min(100%, calc(177.78dvh - 9.4rem))' }}
            >
              <SlideView slide={slide} imageUrl={slideImage} variant="tv" />
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-4 px-6 text-center">
            <MonitorPlay className="h-16 w-16 text-[var(--accent)]" aria-hidden="true" />
            <h1 className="text-2xl font-black uppercase tracking-[0.22em] text-[var(--ink)] sm:text-3xl">
              Aguardando o professor…
            </h1>
            <p className="text-sm font-semibold text-[var(--muted)]">
              Sessão <span className="font-mono text-base font-black text-[var(--accent)]">{code}</span> ·
              conecte quando o professor iniciar a aula.
            </p>
            <ConnectionPill status={connection} label="conexão" />
          </div>
        )}
      </div>

      <footer className="flex shrink-0 items-center justify-between gap-3 border-t border-white/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--muted)] sm:px-5">
        <span>
          supp.lol · aula{' '}
          <span className="text-[var(--ink)]">{code || '—'}</span>
          {quizRoom ? <span className="ml-2 text-[var(--accent-2)]">· quiz {quizRoom}</span> : null}
          {warmup === 'd20' ? (
            <span className="ml-2 text-[var(--accent)]">· warm-up D20</span>
          ) : null}
          {warmup === 'comp' ? (
            <span className="ml-2 text-[var(--accent)]">· competição</span>
          ) : null}
        </span>

        <div className="flex items-center gap-3">
          <span className="hidden items-center gap-2 sm:flex">
            {connection === 'connected' ? (
              <Wifi className="h-3.5 w-3.5 text-emerald-400" aria-hidden="true" />
            ) : (
              <WifiOff className="h-3.5 w-3.5 text-amber-400" aria-hidden="true" />
            )}
            <ConnectionPill status={connection} label="aula" />
          </span>
          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Sair da tela cheia' : 'Entrar em tela cheia'}
            className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] p-2 text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            {isFullscreen ? (
              <Minimize className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Maximize className="h-4 w-4" aria-hidden="true" />
            )}
          </button>
        </div>
      </footer>
    </main>
  );
}
