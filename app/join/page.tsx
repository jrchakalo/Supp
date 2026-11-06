'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Gamepad2, Hourglass, RotateCcw, Wifi } from 'lucide-react';
import HalloweenBackdrop from '@/components/HalloweenBackdrop';
import {
  channelNameFor,
  type HostToPlayerMessage,
  type LiveScoreRow,
  type RevealMessage,
} from '@/lib/live/protocol';
import { getSupabaseClient } from '@/lib/live/supabase';
import { readStorage, writeStorage } from '@/lib/storage';
import { ANSWER_BUTTONS, formatPoints, randomId, sanitizeRoomCode } from '@/lib/live/room';

type Phase = 'entry' | 'connecting' | 'lobby' | 'question' | 'answered' | 'reveal' | 'over';

type StoredPlayer = {
  id: string;
  name: string;
};

const PLAYER_STORAGE_KEY = 'live-player';

function readStoredPlayer(): StoredPlayer | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = readStorage(PLAYER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredPlayer>;
    if (typeof parsed.id === 'string' && typeof parsed.name === 'string') {
      return { id: parsed.id, name: parsed.name };
    }
  } catch {
    return null;
  }
  return null;
}

function saveStoredPlayer(player: StoredPlayer) {
  writeStorage(PLAYER_STORAGE_KEY, JSON.stringify(player));
}

function secondsLeft(startedAt: number, timeoutMs: number): number {
  return Math.max((startedAt + timeoutMs - Date.now()) / 1000, 0);
}

export default function JoinPage() {
  const [phase, setPhase] = useState<Phase>('entry');
  const [codeInput, setCodeInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [error, setError] = useState('');

  const [question, setQuestion] = useState<{ text: string; options: string[] } | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [timeoutMs, setTimeoutMs] = useState(0);
  const [chosenIndex, setChosenIndex] = useState<number | null>(null);
  const [reveal, setReveal] = useState<RevealMessage | null>(null);
  const [gameover, setGameover] = useState<{ leaderboard: LiveScoreRow[] } | null>(null);

  const playerRef = useRef<StoredPlayer | null>(null);
  const channelRef = useRef<ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null>(null);
  const seqRef = useRef(-1);
  const chosenSeqRef = useRef(-1);

  /* Prefill the code when the player arrives from a QR scan (?code=XXXXX). */
  useEffect(() => {
    const stored = readStoredPlayer();
    if (stored) {
      playerRef.current = stored;
      setNameInput(stored.name);
    }
    const params = new URLSearchParams(window.location.search);
    const fromQr = sanitizeRoomCode(params.get('code') ?? '');
    if (fromQr) setCodeInput(fromQr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cleanup = useCallback(() => {
    const client = getSupabaseClient();
    const channel = channelRef.current;
    if (channel && client) void client.removeChannel(channel);
    channelRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  /* Leave the finished game and go back to the join screen (new game). */
  const leaveRoom = useCallback(() => {
    cleanup();
    seqRef.current = -1;
    chosenSeqRef.current = -1;
    setQuestion(null);
    setReveal(null);
    setGameover(null);
    setChosenIndex(null);
    setPhase('entry');
  }, [cleanup]);

  /* Auto-return to the join screen one minute after the results. */
  const [returnCountdown, setReturnCountdown] = useState(60);
  useEffect(() => {
    if (phase !== 'over') return;
    setReturnCountdown(60);
    const interval = window.setInterval(() => {
      setReturnCountdown((current) => Math.max(current - 1, 0));
    }, 1000);
    const timeout = window.setTimeout(leaveRoom, 60_000);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [phase, leaveRoom]);

  const handleMessage = useCallback((payload: HostToPlayerMessage) => {
    if (payload.kind === 'lobby') {
      // A new round starts: forget the previous game's sequence.
      seqRef.current = -1;
      chosenSeqRef.current = -1;
      setQuestion(null);
      setReveal(null);
      setGameover(null);
      setChosenIndex(null);
      setPhase('lobby');
      return;
    }
    if (payload.kind === 'question') {
      if (payload.seq <= seqRef.current) return;
      seqRef.current = payload.seq;
      setQuestion({ text: payload.text, options: payload.options });
      setStartedAt(payload.startedAt);
      setTimeoutMs(payload.timeoutMs);
      setChosenIndex(null);
      setChosenSeqRef(-1);
      setReveal(null);
      setPhase('question');
      return;
    }
    if (payload.kind === 'reveal') {
      if (payload.seq !== seqRef.current) return;
      setReveal(payload);
      setPhase('reveal');
      return;
    }
    if (payload.kind === 'gameover') {
      setGameover({ leaderboard: payload.leaderboard });
      setPhase('over');
    }
  }, []);

  function setChosenSeqRef(value: number) {
    chosenSeqRef.current = value;
  }

  const connect = useCallback(() => {
    const client = getSupabaseClient();
    if (!client) {
      setError('Realtime is not configured on the host device.');
      return;
    }

    const code = sanitizeRoomCode(codeInput);
    const name = nameInput.trim().slice(0, 16);
    if (!code) {
      setError('Use the room code, something like K7T2M.');
      return;
    }
    if (name.length < 2) {
      setError('Pick a nickname with at least 2 letters.');
      return;
    }

    // Reuse the saved identity only when the nickname matches: two different
    // players sharing one device must not collide on the same presence key.
    const stored = playerRef.current;
    playerRef.current =
      stored && stored.name.toLowerCase() === name.toLowerCase()
        ? { ...stored, name }
        : { id: randomId('player'), name };
    saveStoredPlayer(playerRef.current);

    setPhase('connecting');
    setError('');

    const channel = client.channel(channelNameFor(code), {
      config: { presence: { key: playerRef.current.id } },
    });

    channel
      .on('broadcast', { event: 'host' }, ({ payload }) => {
        handleMessage(payload as HostToPlayerMessage);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          channelRef.current = channel;
          await channel.track({ name: playerRef.current?.name ?? name });
          setPhase('lobby');
        }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          setPhase('entry');
          setError('Could not reach that room. Check the code and try again.');
        }
      });
  }, [codeInput, handleMessage, nameInput]);

  const answer = useCallback(
    (optionIndex: number) => {
      const channel = channelRef.current;
      const player = playerRef.current;
      if (!channel || !player) return;
      if (chosenSeqRef.current === seqRef.current) return;

      chosenSeqRef.current = seqRef.current;
      setChosenIndex(optionIndex);
      setPhase('answered');

      void channel.send({
        type: 'broadcast',
        event: 'player',
        payload: {
          kind: 'answer',
          playerId: player.id,
          name: player.name,
          seq: seqRef.current,
          optionIndex,
        },
      });
    },
    []
  );

  /* Countdown ticker on the phone. */
  const [, setTick] = useState(0);
  useEffect(() => {
    if (phase !== 'question') return;
    const interval = window.setInterval(() => setTick((n) => n + 1), 250);
    return () => window.clearInterval(interval);
  }, [phase]);

  /* ------------------------------------------------------------------ */
  /* Render                                                              */
  /* ------------------------------------------------------------------ */

  const ratio =
    startedAt && timeoutMs ? Math.max(secondsLeft(startedAt, timeoutMs) / (timeoutMs / 1000), 0) : 0;

  return (
    <main className="game-shell theme-halloween relative flex min-h-dvh w-full flex-col items-center px-4 py-6">
      <HalloweenBackdrop dimmed={phase !== 'entry'} />

      <div
        className={`relative z-10 flex w-full flex-1 flex-col ${
          phase === 'question' || phase === 'answered' || phase === 'reveal' ? 'max-w-5xl' : 'max-w-md'
        }`}
      >
          {phase === 'entry' && (
            <motion.section
              key="entry"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="m-auto w-full rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 sm:p-8"
            >
              <span className="text-xs font-black uppercase tracking-[0.18em] text-[var(--accent)]">
                Halloween Live
              </span>
              <h1 className="mt-1 text-3xl font-black uppercase tracking-tight text-[var(--ink)]">Join a room</h1>

              <label className="mt-6 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                Room code
              </label>
              <input
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                placeholder="K7T2M"
                autoComplete="off"
                autoCapitalize="characters"
                maxLength={6}
                className="mt-1 w-full rounded-2xl border-4 border-[var(--line)] bg-[var(--surface-2)] px-4 py-3 text-center text-2xl font-black tracking-[0.3em] text-[var(--ink)] outline-none"
              />

              <label className="mt-4 block text-xs font-black uppercase tracking-[0.18em] text-[var(--muted)]">
                Nickname
              </label>
              <input
                value={nameInput}
                onChange={(event) => setNameInput(event.target.value.slice(0, 16))}
                placeholder="Ghost 👻"
                autoComplete="off"
                maxLength={16}
                className="mt-1 w-full rounded-2xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3 text-lg font-black text-[var(--ink)] outline-none"
              />

              {error ? <p className="mt-3 text-sm font-bold text-red-500">{error}</p> : null}

              <button
                type="button"
                onClick={connect}
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
              >
                <Gamepad2 className="h-5 w-5" aria-hidden="true" />
                Enter the room
              </button>
            </motion.section>
          )}

          {phase === 'connecting' && (
            <motion.section
              key="connecting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="m-auto flex flex-col items-center gap-3 text-[var(--muted)]"
            >
              <Wifi className="h-8 w-8 animate-pulse text-[var(--accent)]" aria-hidden="true" />
              <p className="text-sm font-black uppercase tracking-wide">Connecting…</p>
            </motion.section>
          )}

          {phase === 'lobby' && (
            <motion.section
              key="lobby"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="m-auto w-full rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 text-center sm:p-8"
            >
              <Hourglass className="mx-auto h-10 w-10 text-[var(--accent)]" aria-hidden="true" />
              <h1 className="mt-3 text-3xl font-black uppercase text-[var(--ink)]">
                You're in, {playerRef.current?.name}!
              </h1>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                Watch the teacher's screen. When the question appears, tap your answer here — faster answers score
                more points.
              </p>
            </motion.section>
          )}

          {(phase === 'question' || phase === 'answered') && question && (
            <motion.section
              key={`question-${seqRef.current}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex flex-1 flex-col py-4"
            >
              <div className="rounded-2xl bg-white/90 p-3">
                <div className="h-2.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-[#7b2ff7] transition-[width] duration-200"
                    style={{ width: `${ratio * 100}%` }}
                  />
                </div>
              </div>

              {/* Only the answer tiles show here: the question lives on the projector.
                  The grid fills the screen (timer included) and widens the tiles so they
                  stay as close to square as the viewport allows — never scrolls. */}
              <div
                className="mx-auto mt-3 grid w-full min-h-0 flex-1 grid-cols-2 grid-rows-2 gap-2.5"
                style={{ maxWidth: 'min(56rem, calc((100dvh - 12rem) * 2))' }}
              >
                {question.options.map((_, index) => {
                  const style = ANSWER_BUTTONS[index];
                  const locked = chosenSeqRef.current === seqRef.current;
                  const chosen = chosenIndex === index;
                  const disabled = locked || (reveal !== null);

                  return (
                    <motion.button
                      key={index}
                      type="button"
                      whileTap={disabled ? undefined : { scale: 0.97 }}
                      disabled={disabled}
                      onClick={() => answer(index)}
                      className={`flex h-full min-h-0 w-full items-center justify-center rounded-3xl text-white shadow-xl transition-opacity ${
                        locked && !chosen ? 'opacity-40' : ''
                      } ${chosen ? 'ring-4 ring-white/80' : ''}`}
                      style={{ backgroundColor: style.bg }}
                    >
                      <span className="text-6xl sm:text-7xl" aria-hidden="true">
                        {style.shape}
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {phase === 'answered' ? (
                <p className="mb-1 mt-3 text-center text-xs font-black uppercase tracking-wide text-emerald-400">
                  Locked in! Waiting for the reveal…
                </p>
              ) : null}
            </motion.section>
          )}

          {phase === 'reveal' && reveal && (
            <motion.section
              key={`reveal-${reveal.seq}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="mt-4"
            >
              <div className="rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 text-center">
                <h1 className="text-xl font-black text-[var(--ink)] sm:text-2xl">{reveal.text}</h1>
                <p className="mt-2 text-sm font-semibold text-[var(--muted)]">{reveal.explanation}</p>

                <div className="mt-5 space-y-2">
                  {reveal.options.map((option, index) => {
                    const style = ANSWER_BUTTONS[index];
                    const correct = index === reveal.correctIndex;
                    const chosen = chosenIndex === index;
                    const row = reveal.leaderboard.find(
                      (entry) => entry.playerId === playerRef.current?.id
                    );

                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-white ${
                          correct ? 'ring-4 ring-emerald-400' : ''
                        }`}
                        style={{ backgroundColor: style.bg }}
                      >
                        <span className="text-xl" aria-hidden="true">
                          {style.shape}
                        </span>
                        <span className="flex-1 text-left text-sm font-black">{option}</span>
                        {chosen && correct ? <span className="text-xs font-black">You nailed it!</span> : null}
                        {chosen && !correct ? <span className="text-xs font-black">Your pick</span> : null}
                      </div>
                    );
                  })}
                </div>

                {(() => {
                  const row = reveal.leaderboard.find(
                    (entry) => entry.playerId === playerRef.current?.id
                  );
                  if (!row) return null;
                  return (
                    <div className="mt-5 rounded-2xl bg-[var(--surface-2)] px-4 py-3">
                      {row.gained > 0 ? (
                        <p className="text-lg font-black text-emerald-500">{formatPoints(row.gained)}</p>
                      ) : (
                        <p className="text-lg font-black text-[var(--muted)]">Better luck next one!</p>
                      )}
                      <p className="text-xs font-black uppercase tracking-wide text-[var(--muted)]">
                        Total: {row.total.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </motion.section>
          )}

          {phase === 'over' && (
            <motion.section
              key="over"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="m-auto w-full rounded-3xl border-4 border-[var(--line)] bg-[var(--surface)] p-6 text-center sm:p-8"
            >
              <p className="text-lg font-black text-[var(--accent)]">🦇 That's a wrap!</p>
              {(() => {
                const leaderboard = gameover?.leaderboard ?? [];
                const index = leaderboard.findIndex((r) => r.playerId === playerRef.current?.id);
                if (index === -1) {
                  return (
                    <>
                      <h1 className="mt-2 text-3xl font-black uppercase text-[var(--ink)]">Game over</h1>
                      <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                        Check the podium on the teacher's screen!
                      </p>
                    </>
                  );
                }
                const row = leaderboard[index];
                return (
                  <>
                    <h1 className="mt-2 text-3xl font-black uppercase text-[var(--ink)]">
                      {row.total.toLocaleString('pt-BR')} points
                    </h1>
                    <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
                      Place {index + 1} of {leaderboard.length} — check the podium on the teacher's screen!
                    </p>
                  </>
                );
              })()}

              <button
                type="button"
                onClick={leaveRoom}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[var(--cta-bg)] px-5 py-3.5 text-base font-black uppercase tracking-wide text-[var(--cta-text)]"
              >
                <RotateCcw className="h-5 w-5" aria-hidden="true" />
                Back to the join screen
              </button>
              <p className="mt-3 text-xs font-semibold text-[var(--muted)]">
                Going back automatically in {returnCountdown} s
              </p>
            </motion.section>
          )}
      </div>
    </main>
  );
}
