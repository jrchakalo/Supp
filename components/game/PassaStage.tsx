'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Timer, Trophy } from 'lucide-react';
import { ANSWER_BUTTONS } from '@/lib/live/room';
import { categoryCopy } from '@/lib/i18n/game-copy';
import type { PassaGameState } from '@/lib/aula/games';

type PassaStageProps = {
  state: PassaGameState;
  onAnswer?: (optionIndex: number) => void;
};

export default function PassaStage({ state, onAnswer }: PassaStageProps) {
  const [clock, setClock] = useState(() => Date.now());
  const celebratedRef = useRef<string>('');

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const secondsLeft =
    state.deadline && (state.phase === 'question' || state.phase === 'steal')
      ? Math.max(0, Math.ceil((state.deadline - clock) / 1000))
      : 0;

  useEffect(() => {
    const key = `${state.round}:${state.phase}:${state.lastResult?.team ?? 'x'}`;
    const won = state.phase === 'over' && state.winner !== null;
    const scored =
      state.phase === 'reveal' && state.lastResult?.correct === true;
    if ((won || scored) && celebratedRef.current !== key) {
      celebratedRef.current = key;
      confetti({
        particleCount: won ? 180 : 90,
        spread: won ? 100 : 70,
        origin: { y: won ? 0.5 : 0.65 },
        colors: ['#ffd166', '#4cc9f0', '#22c55e', '#f472b6'],
      });
    }
  }, [state.phase, state.round, state.winner, state.lastResult]);

  const activeName = state.teams[state.activeTeam];
  const result = state.lastResult;
  const categoryLabel = state.question?.category
    ? categoryCopy(state.question.category, 'pt').label
    : null;

  return (
    <div className="flex h-full flex-col px-4 py-3 sm:px-6 sm:py-4">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            Passa Repassa
          </p>
          <h1 className="mt-0.5 text-xl font-black">
            {state.phase === 'steal' ? `Roubo · ${activeName}` : `Vez de ${activeName}`}
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs font-black">
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-[var(--muted)]">
            Rodada {state.round} · até {state.target} pontos
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-[var(--accent)]">
            <Timer className="h-4 w-4" aria-hidden="true" />
            {secondsLeft}s
          </span>
        </div>
      </header>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {state.teams.map((team, index) => {
          const active = index === state.activeTeam && state.phase !== 'over';
          return (
            <div
              key={team}
              className={`rounded-2xl border-2 px-4 py-2.5 ${
                active
                  ? 'border-[var(--accent)] bg-[var(--accent)]/10'
                  : 'border-[var(--line)] bg-[var(--surface)]'
              }`}
            >
              <p className="flex items-center justify-between gap-2 text-sm font-black">
                <span className="truncate">{team}</span>
                <span className="text-2xl text-[var(--accent)]">{state.scores[index]}</span>
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-3 flex min-h-0 flex-1 flex-col rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 sm:p-6">
        {state.phase === 'over' ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <Trophy className="h-14 w-14 text-[var(--accent)]" aria-hidden="true" />
            <p className="mt-3 text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
              Fim da partida
            </p>
            <h2 className="mt-1 text-5xl font-black">
              {state.winner !== null ? `${state.teams[state.winner]} venceu!` : 'Fim!'}
            </h2>
            <p className="mt-2 text-lg font-bold text-[var(--muted)]">
              {state.teams[0]} {state.scores[0]} × {state.scores[1]} {state.teams[1]}
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[var(--accent)]">
                {state.phase === 'steal' ? 'Repasse' : categoryLabel ?? 'Pergunta'}
              </p>
              <p className="text-[11px] font-bold text-[var(--muted)]">
                {state.phase === 'steal'
                  ? `${activeName} pode roubar`
                  : `${activeName} responde`}
              </p>
            </div>

            <motion.h2
              key={`${state.question?.id}-${state.phase}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-[clamp(1.4rem,3vw,2.6rem)] font-black leading-tight"
            >
              {state.question?.text ?? 'Sem pergunta'}
            </motion.h2>

            <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 content-center gap-2 sm:grid-cols-2">
              {(state.question?.options ?? []).map((option, index) => {
                const style = ANSWER_BUTTONS[index % ANSWER_BUTTONS.length];
                const correct = state.revealed && index === state.question?.correctIndex;
                const chosen = state.chosenIndex === index;
                const wrongChosen = state.revealed && chosen && !correct;
                return (
                  <motion.button
                    key={`${option}-${index}`}
                    type="button"
                    onClick={() => onAnswer?.(index)}
                    disabled={state.revealed || !onAnswer}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04 }}
                    className={`flex min-h-[4.2rem] min-w-0 items-center gap-3 rounded-2xl px-4 py-2.5 text-left text-white shadow-[var(--tile-shadow)] transition disabled:cursor-default ${
                      correct
                        ? 'ring-4 ring-emerald-400'
                        : wrongChosen
                          ? 'opacity-55 ring-4 ring-rose-400'
                          : state.revealed
                            ? 'opacity-65'
                            : 'hover:ring-2 hover:ring-white/40'
                    }`}
                    style={{ backgroundColor: style.bg }}
                  >
                    <span aria-hidden="true" className="shrink-0 text-2xl leading-none">
                      {style.shape}
                    </span>
                    <span className="min-w-0 flex-1 break-words text-[clamp(0.95rem,1.6vw,1.35rem)] font-black leading-tight">
                      {option}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {state.revealed ? (
              <div className="mt-3 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-2.5">
                <p
                  className={`text-sm font-black ${
                    result?.correct ? 'text-emerald-300' : 'text-rose-300'
                  }`}
                >
                  {result?.correct
                    ? result.stolen
                      ? `Roubo certo de ${state.teams[result.team ?? 0]}!`
                      : `Ponto de ${state.teams[result.team ?? 0]}!`
                    : 'Ninguém pontuou.'}
                </p>
                {state.question?.explanation ? (
                  <p className="mt-1 text-xs font-semibold leading-snug text-[var(--muted)]">
                    {state.question.explanation}
                  </p>
                ) : null}
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
