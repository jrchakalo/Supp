'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ClassicCategoryId, DifficultyId, ModeId } from '../types';
import type { Language } from '../i18n';
import { localizeLiveQuestions } from '../i18n';
import { getSupabaseClient } from './supabase';
import {
  channelNameFor,
  type HostToPlayerMessage,
  type LiveScoreRow,
  type QuestionStartMessage,
  type RevealMessage,
} from './protocol';
import {
  buildQuestionRun,
  prepareQuestion,
  randomId,
  scoreForAnswer,
  sortLeaderboard,
  type PreparedLiveQuestion,
} from './room';
import { readRecentLiveIds, rememberLiveRun } from './history';
import { readStorage, removeStorage, writeStorage } from '../storage';

/**
 * Embedded Live host: the professor's tab is the single authority for the
 * room. Players still join by code/QR on their phones; the TV subscribes to
 * the same Realtime channel. No second tab and no iframe.
 */

const STORAGE_NAME = 'live-embed-host';
const REVEAL_ADVANCE_MS = 7000;

type HostQuestion = PreparedLiveQuestion & { explanation: string };
export type LiveHostPhase = 'lobby' | 'question' | 'reveal' | 'over';
type Reply = {
  playerId: string;
  name: string;
  optionIndex: number;
  elapsedMs: number;
};
type ScoreEntry = { name: string; total: number; streak: number };
export type LiveHostReveal = {
  seq: number;
  correctIndex: number;
  counts: number[];
  explanation: string;
  leaderboard: LiveScoreRow[];
};
type Snapshot = {
  code: string;
  phase: LiveHostPhase;
  seq: number;
  run: HostQuestion[];
  question: HostQuestion | null;
  reveal: LiveHostReveal | null;
  scores: Record<string, ScoreEntry>;
  replies: Reply[];
  startedAt: number;
  timeoutMs: number;
  autoAdvance: boolean;
};

export type LiveHostOptions = {
  questionCount: 8 | 12 | 16;
  seconds: 15 | 20 | 30;
  difficulty: DifficultyId;
  mode: ModeId;
  language: Language;
  categories?: ClassicCategoryId[];
  showQuestionOnPlayer: boolean;
  translateAtHalf: boolean;
  autoAdvance: boolean;
};

export function useLiveHost(options: LiveHostOptions) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const [status, setStatus] = useState<'idle' | 'connecting' | 'live'>('idle');
  const [code, setCode] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState('');
  const [players, setPlayers] = useState<{ id: string; name: string }[]>([]);
  const [phase, setPhase] = useState<LiveHostPhase>('lobby');
  const [seq, setSeq] = useState(0);
  const [total, setTotal] = useState(0);
  const [question, setQuestion] = useState<HostQuestion | null>(null);
  const [reveal, setReveal] = useState<LiveHostReveal | null>(null);
  const [startedAt, setStartedAt] = useState(0);
  const [msLeft, setMsLeft] = useState(0);
  const [answered, setAnswered] = useState(0);
  const [autoAdvance, setAutoAdvance] = useState(options.autoAdvance);
  const [revealCountdown, setRevealCountdown] = useState(7);
  const [scoresVersion, setScoresVersion] = useState(0);

  const channelRef = useRef<ReturnType<
    NonNullable<ReturnType<typeof getSupabaseClient>>['channel']
  > | null>(null);
  const statusRef = useRef(status);
  statusRef.current = status;
  const runRef = useRef<HostQuestion[]>([]);
  const seqRef = useRef(0);
  const questionRef = useRef<HostQuestion | null>(null);
  const revealRef = useRef<LiveHostReveal | null>(null);
  revealRef.current = reveal;
  const startedAtRef = useRef(0);
  const repliesRef = useRef<Reply[]>([]);
  const scoresRef = useRef<Record<string, ScoreEntry>>({});
  const playersRef = useRef<{ id: string; name: string }[]>([]);
  playersRef.current = players;
  const phaseRef = useRef<LiveHostPhase>(phase);
  phaseRef.current = phase;
  const timeoutRef = useRef<number | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const lastMessageRef = useRef<HostToPlayerMessage | null>(null);
  const readyRef = useRef(false);
  const revealedIdsRef = useRef<Set<string>>(new Set());
  const lastAdvanceAtRef = useRef(0);

  const broadcast = useCallback((payload: HostToPlayerMessage) => {
    lastMessageRef.current = payload;
    channelRef.current?.send({ type: 'broadcast', event: 'host', payload });
  }, []);

  const questionMessage = useCallback(
    (current: HostQuestion, seqIndex: number, at: number, timeoutMs: number): QuestionStartMessage => {
      const translate =
        optionsRef.current.translateAtHalf && Boolean(current.textPt)
          ? {
              textPt: current.textPt,
              optionsPt: current.optionsPt,
              translateAtMs: Math.round(timeoutMs / 2),
            }
          : {};
      return {
        kind: 'question',
        seq: seqIndex,
        questionId: current.id,
        text: current.text,
        options: current.options,
        timeoutMs,
        startedAt: at,
        ...translate,
      };
    },
    []
  );

  const endQuestion = useCallback(
    (seqIndex: number) => {
      const current = questionRef.current;
      if (!current || phaseRef.current !== 'question') return;
      if (revealedIdsRef.current.has(current.id)) return;
      revealedIdsRef.current.add(current.id);

      const counts = [0, 0, 0, 0];
      const nextScores = { ...scoresRef.current };
      for (const reply of repliesRef.current) {
        counts[reply.optionIndex] = (counts[reply.optionIndex] ?? 0) + 1;
      }

      const playerNames = new Map(playersRef.current.map((player) => [player.id, player.name]));
      for (const reply of repliesRef.current) playerNames.set(reply.playerId, reply.name);

      const rows: LiveScoreRow[] = [];
      for (const [playerId, name] of playerNames) {
        const reply = repliesRef.current.find((item) => item.playerId === playerId);
        const previous = nextScores[playerId] ?? { name, total: 0, streak: 0 };
        const correct = Boolean(reply && reply.optionIndex === current.correctIndex);
        const gained = correct
          ? scoreForAnswer(reply!.elapsedMs, optionsRef.current.seconds * 1000)
          : 0;
        const streak = correct ? previous.streak + 1 : 0;
        nextScores[playerId] = { name, total: previous.total + gained, streak };
        rows.push({
          playerId,
          name,
          total: nextScores[playerId].total,
          streak,
          gained,
          correct,
        });
      }
      for (const [playerId, entry] of Object.entries(nextScores)) {
        if (!rows.some((row) => row.playerId === playerId)) {
          rows.push({
            playerId,
            name: entry.name,
            total: entry.total,
            streak: entry.streak,
            gained: 0,
            correct: false,
          });
        }
      }

      const leaderboard = sortLeaderboard(rows);
      const nextReveal: LiveHostReveal = {
        seq: seqIndex,
        correctIndex: current.correctIndex,
        counts,
        explanation: current.explanation,
        leaderboard,
      };
      scoresRef.current = nextScores;
      setScoresVersion((version) => version + 1);
      repliesRef.current = [];
      setAnswered(0);
      setReveal(nextReveal);
      revealRef.current = nextReveal;
      setPhase('reveal');
      phaseRef.current = 'reveal';
      broadcast({
        kind: 'reveal',
        seq: seqIndex,
        questionId: current.id,
        text: current.text,
        options: current.options,
        correctIndex: current.correctIndex,
        explanation: current.explanation,
        counts,
        leaderboard,
      });
    },
    [broadcast]
  );
  const endQuestionRef = useRef(endQuestion);
  endQuestionRef.current = endQuestion;

  const askQuestion = useCallback(
    (seqIndex: number) => {
      const current = runRef.current[seqIndex];
      if (!current) return;
      const timeoutMs = optionsRef.current.seconds * 1000;
      const now = Date.now();

      questionRef.current = current;
      startedAtRef.current = now;
      repliesRef.current = [];
      setAnswered(0);
      setQuestion(current);
      setSeq(seqIndex);
      seqRef.current = seqIndex;
      setStartedAt(now);
      setMsLeft(timeoutMs);
      setReveal(null);
      revealRef.current = null;
      setPhase('question');
      phaseRef.current = 'question';
      broadcast(questionMessage(current, seqIndex, now, timeoutMs));

      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => {
        endQuestionRef.current(seqIndex);
      }, timeoutMs);
    },
    [broadcast, questionMessage]
  );

  const startGame = useCallback(() => {
    if (statusRef.current !== 'live') return;
    const options = optionsRef.current;
    const source = buildQuestionRun(
      options.mode,
      options.difficulty,
      options.questionCount,
      options.categories,
      readRecentLiveIds(options.mode)
    );
    const localized = localizeLiveQuestions(source, options.language);
    if (localized.length === 0) return;
    const run = localized.map((item) => ({
      ...prepareQuestion(item),
      explanation: item.explanation,
    }));
    rememberLiveRun(
      options.mode,
      localized.map((item) => item.id)
    );
    setAutoAdvance(options.autoAdvance);

    runRef.current = run;
    setTotal(run.length);
    scoresRef.current = {};
    repliesRef.current = [];
    revealedIdsRef.current = new Set();
    setScoresVersion((version) => version + 1);
    setAnswered(0);
    setReveal(null);
    setQuestion(null);
    askQuestion(0);
  }, [askQuestion]);

  const nextQuestion = useCallback(() => {
    const now = Date.now();
    if (now - lastAdvanceAtRef.current < 600) return;
    lastAdvanceAtRef.current = now;
    if (revealTimerRef.current) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
    const next = seqRef.current + 1;
    if (next >= runRef.current.length) {
      const rows = sortLeaderboard(
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
      phaseRef.current = 'over';
      broadcast({ kind: 'gameover', leaderboard: rows });
      return;
    }
    askQuestion(next);
  }, [askQuestion, broadcast]);
  const nextQuestionRef = useRef(nextQuestion);
  nextQuestionRef.current = nextQuestion;

  const finishGame = useCallback(() => {
    const rows = sortLeaderboard(
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
    phaseRef.current = 'over';
    broadcast({ kind: 'gameover', leaderboard: rows });
  }, [broadcast]);

  const closeRoom = useCallback(() => {
    broadcast({ kind: 'roomclosed' });
    removeStorage(STORAGE_NAME);
    if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
    const channel = channelRef.current;
    const client = getSupabaseClient();
    if (channel && client) void client.removeChannel(channel);
    channelRef.current = null;
    statusRef.current = 'idle';
    setStatus('idle');
    setCode(null);
    setJoinUrl('');
    setPlayers([]);
    setPhase('lobby');
    phaseRef.current = 'lobby';
    setQuestion(null);
    questionRef.current = null;
    setReveal(null);
    revealRef.current = null;
    setSeq(0);
    seqRef.current = 0;
    setTotal(0);
    runRef.current = [];
    scoresRef.current = {};
    repliesRef.current = [];
    setScoresVersion((version) => version + 1);
    setAnswered(0);
    setMsLeft(0);
  }, [broadcast]);

  const openRoom = useCallback(
    (roomCode: string) => {
      if (statusRef.current !== 'idle') return;
      const client = getSupabaseClient();
      if (!client) return;

      /* Read the snapshot before any state update: the save effect would
         otherwise overwrite it with the empty initial state. */
      let restored: Snapshot | null = null;
      const raw = readStorage(STORAGE_NAME);
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as Snapshot;
          if (parsed.code === roomCode && Array.isArray(parsed.run)) restored = parsed;
        } catch {
          restored = null;
        }
      }

      statusRef.current = 'connecting';
      setStatus('connecting');
      setCode(roomCode);
      readyRef.current = false;
      lastMessageRef.current = null;

      const channel = client.channel(channelNameFor(roomCode), {
        config: { presence: { key: randomId('host') } },
      });

      const sendLobby = () => {
        broadcast({
          kind: 'lobby',
          code: roomCode,
          config: {
            mode: optionsRef.current.mode,
            language: optionsRef.current.language,
            theme: 'dark',
            difficulty: optionsRef.current.difficulty,
            questionCount: optionsRef.current.questionCount,
            secondsPerQuestion: optionsRef.current.seconds,
            showQuestionOnPlayer: optionsRef.current.showQuestionOnPlayer,
            translateAtHalf: optionsRef.current.translateAtHalf,
            categories: optionsRef.current.categories,
          },
        });
      };

      channel
        .on('broadcast', { event: 'player' }, ({ payload }) => {
          const message = payload as { kind?: string };
          if (message?.kind !== 'answer' || phaseRef.current !== 'question') return;
          const answer = payload as {
            kind: 'answer';
            playerId: string;
            name: string;
            seq: number;
            optionIndex: number;
          };
          if (answer.seq !== seqRef.current) return;
          if (repliesRef.current.some((reply) => reply.playerId === answer.playerId)) return;

          const elapsedMs = Math.max(Date.now() - startedAtRef.current, 0);
          repliesRef.current = [
            ...repliesRef.current,
            {
              playerId: answer.playerId,
              name: answer.name.slice(0, 16),
              optionIndex: answer.optionIndex,
              elapsedMs,
            },
          ];
          setAnswered(repliesRef.current.length);
          if (
            playersRef.current.length > 0 &&
            repliesRef.current.length >= playersRef.current.length
          ) {
            if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
            endQuestionRef.current(answer.seq);
          }
        })
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState() as Record<string, { name?: string }[]>;
          const next: { id: string; name: string }[] = [];
          for (const [id, metas] of Object.entries(state)) {
            if (id.startsWith('host-')) continue;
            const name = metas[0]?.name;
            if (name) next.push({ id, name: String(name).slice(0, 16) });
          }
          next.sort((a, b) => a.name.localeCompare(b.name));
          playersRef.current = next;
          setPlayers(next);
        })
        .on('presence', { event: 'join' }, () => {
          if (!readyRef.current) return;
          if (phaseRef.current === 'lobby' || !lastMessageRef.current) sendLobby();
          else if (lastMessageRef.current)
            channel.send({
              type: 'broadcast',
              event: 'host',
              payload: lastMessageRef.current,
            });
        })
        .subscribe(async (state) => {
          if (state !== 'SUBSCRIBED') return;
          channelRef.current = channel;
          statusRef.current = 'live';
          setStatus('live');
          setJoinUrl(
            `${window.location.origin}/join?code=${roomCode}&mode=${optionsRef.current.mode}&theme=dark`
          );
          await channel.track({ name: 'HOST' });

          const snap = restored;
          if (!snap) {
            setPhase('lobby');
            phaseRef.current = 'lobby';
            readyRef.current = true;
            sendLobby();
            return;
          }

          runRef.current = snap.run;
          scoresRef.current = snap.scores ?? {};
          repliesRef.current = snap.replies ?? [];
          seqRef.current = snap.seq;
          questionRef.current = snap.question;
          startedAtRef.current = snap.startedAt;
          revealedIdsRef.current = new Set(
            snap.phase === 'reveal' || snap.phase === 'over'
              ? snap.run.map((item) => item.id)
              : []
          );
          setTotal(snap.run.length);
          setSeq(snap.seq);
          setQuestion(snap.question);
          setScoresVersion((version) => version + 1);
          setAnswered(repliesRef.current.length);
          setAutoAdvance(snap.autoAdvance ?? optionsRef.current.autoAdvance);

          if (snap.phase === 'question' && snap.question) {
            const remaining = snap.startedAt + snap.timeoutMs - Date.now();
            if (remaining > 0) {
              setPhase('question');
              phaseRef.current = 'question';
              setStartedAt(snap.startedAt);
              setMsLeft(remaining);
              broadcast(
                questionMessage(snap.question, snap.seq, snap.startedAt, snap.timeoutMs)
              );
              readyRef.current = true;
              if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
              timeoutRef.current = window.setTimeout(() => {
                endQuestionRef.current(snap!.seq);
              }, remaining);
            } else {
              setPhase('question');
              phaseRef.current = 'question';
              readyRef.current = true;
              endQuestionRef.current(snap.seq);
            }
            return;
          }

          if (snap.phase === 'reveal' && snap.reveal && snap.question) {
            setReveal(snap.reveal);
            revealRef.current = snap.reveal;
            setPhase('reveal');
            phaseRef.current = 'reveal';
            broadcast({
              kind: 'reveal',
              seq: snap.reveal.seq,
              questionId: snap.question.id,
              text: snap.question.text,
              options: snap.question.options,
              correctIndex: snap.reveal.correctIndex,
              explanation: snap.reveal.explanation,
              counts: snap.reveal.counts,
              leaderboard: snap.reveal.leaderboard,
            } satisfies RevealMessage);
            readyRef.current = true;
            return;
          }

          if (snap.phase === 'over') {
            setPhase('over');
            phaseRef.current = 'over';
            broadcast({
              kind: 'gameover',
              leaderboard: sortLeaderboard(
                Object.entries(scoresRef.current).map(([playerId, entry]) => ({
                  playerId,
                  name: entry.name,
                  total: entry.total,
                  streak: entry.streak,
                  gained: 0,
                  correct: false,
                }))
              ),
            });
            readyRef.current = true;
            return;
          }

          setPhase('lobby');
          phaseRef.current = 'lobby';
          readyRef.current = true;
          sendLobby();
        });
    },
    [broadcast, questionMessage]
  );

  /* Tick the projected countdown. */
  useEffect(() => {
    if (phase !== 'question') return;
    const tick = window.setInterval(() => {
      setMsLeft(
        Math.max(startedAtRef.current + optionsRef.current.seconds * 1000 - Date.now(), 0)
      );
    }, 200);
    return () => window.clearInterval(tick);
  }, [phase, startedAt]);

  /* Reveal → next question, with the same 7 s auto-advance as /host. */
  useEffect(() => {
    if (phase !== 'reveal') return;
    setRevealCountdown(Math.round(REVEAL_ADVANCE_MS / 1000));
    if (!autoAdvance) return;
    revealTimerRef.current = window.setTimeout(() => {
      revealTimerRef.current = null;
      nextQuestionRef.current();
    }, REVEAL_ADVANCE_MS);
    const interval = window.setInterval(() => {
      setRevealCountdown((current) => Math.max(current - 1, 0));
    }, 1000);
    return () => {
      window.clearInterval(interval);
      if (revealTimerRef.current) {
        window.clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [phase, autoAdvance]);

  /* Persist the run so an accidental F5 in the professor can resume it. */
  useEffect(() => {
    if (status !== 'live' || !code) return;
    const snapshot: Snapshot = {
      code,
      phase,
      seq,
      run: runRef.current,
      question: questionRef.current,
      reveal,
      scores: scoresRef.current,
      replies: repliesRef.current,
      startedAt: startedAtRef.current,
      timeoutMs: optionsRef.current.seconds * 1000,
      autoAdvance,
    };
    writeStorage(STORAGE_NAME, JSON.stringify(snapshot));
  }, [status, code, phase, seq, reveal, answered, autoAdvance, scoresVersion]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      if (revealTimerRef.current) window.clearTimeout(revealTimerRef.current);
      const channel = channelRef.current;
      const client = getSupabaseClient();
      if (channel && client) void client.removeChannel(channel);
      channelRef.current = null;
    };
  }, []);

  const finalLeaderboard = useMemo<LiveScoreRow[]>(
    () =>
      sortLeaderboard(
        Object.entries(scoresRef.current).map(([playerId, entry]) => ({
          playerId,
          name: entry.name,
          total: entry.total,
          streak: entry.streak,
          gained: 0,
          correct: false,
        }))
      ),
    // The version bumps whenever scoresRef changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [scoresVersion]
  );

  return {
    status,
    code,
    joinUrl,
    players,
    phase,
    seq,
    total,
    question,
    reveal,
    msLeft,
    answered,
    autoAdvance,
    revealCountdown,
    finalLeaderboard,
    secondsPerQuestion: optionsRef.current.seconds,
    openRoom,
    startGame,
    endQuestion: () => endQuestion(seqRef.current),
    nextQuestion,
    finishGame,
    closeRoom,
    toggleAutoAdvance: () => setAutoAdvance((value) => !value),
  };
}

export type LiveHost = ReturnType<typeof useLiveHost>;
