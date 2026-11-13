'use client';

import { useEffect, useState } from 'react';
import { RotateCcw, Square, Timer, Trophy } from 'lucide-react';
import type { PassaGameState } from '@/lib/aula/games';

type PassaControlProps = {
  state: PassaGameState;
  onAnswer: (optionIndex: number) => void;
  onNext: () => void;
  onNew: () => void;
  onEnd: () => void;
};

const LETTERS = ['A', 'B', 'C', 'D'];

export default function PassaControl({
  state,
  onAnswer,
  onNext,
  onNew,
  onEnd,
}: PassaControlProps) {
  const [clock, setClock] = useState(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setClock(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, []);

  const secondsLeft =
    state.deadline && (state.phase === 'question' || state.phase === 'steal')
      ? Math.max(0, Math.ceil((state.deadline - clock) / 1000))
      : 0;

  return (
    <div
      className="mt-3 rounded-2xl border-2 border-[var(--accent-2)] bg-[var(--surface)] px-4 py-3"
      role="region"
      aria-label="Passa Repassa na TV"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-black">
            <Trophy className="h-4 w-4 text-[var(--accent-2)]" aria-hidden="true" />
            Passa Repassa na TV
            <span className="text-xs font-semibold text-[var(--muted)]">
              {state.teams[0]} {state.scores[0]} × {state.scores[1]} {state.teams[1]}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)]">
              <Timer className="h-3.5 w-3.5" aria-hidden="true" />
              {secondsLeft}s
            </span>
            <span className="rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
              {state.phase === 'steal' ? 'ROUBO' : `RODADA ${state.round}`}
            </span>
          </p>

          {state.phase === 'question' || state.phase === 'steal' ? (
            <>
              <p className="mt-1 text-sm font-black leading-snug">
                {state.question?.text ?? 'Sem pergunta'}
              </p>
              <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {(state.question?.options ?? []).map((option, index) => (
                  <button
                    key={`${option}-${index}`}
                    type="button"
                    onClick={() => onAnswer(index)}
                    className="flex items-start gap-2 rounded-xl border-2 border-[var(--line-soft)] bg-[var(--surface-2)] px-2.5 py-2 text-left text-[11px] font-bold text-[var(--ink)] transition hover:border-[var(--accent)]"
                  >
                    <span className="font-black text-[var(--accent)]">{LETTERS[index]}</span>
                    <span className="min-w-0 break-words">{option}</span>
                  </button>
                ))}
              </div>
              <p className="mt-1 text-[10px] font-semibold text-[var(--muted)]">
                Clique na opção que o time escolheu.
              </p>
            </>
          ) : state.phase === 'reveal' ? (
            <p className="mt-1 text-sm font-black text-[var(--muted)]">
              {state.lastResult?.correct
                ? state.lastResult.stolen
                  ? `Roubo certo de ${state.teams[state.lastResult.team ?? 0]}!`
                  : `Ponto de ${state.teams[state.lastResult.team ?? 0]}!`
                : 'Ninguém pontuou.'}
              {state.question?.explanation ? ` · ${state.question.explanation}` : ''}
            </p>
          ) : (
            <p className="mt-1 text-sm font-black text-[var(--accent)]">
              {state.winner !== null
                ? `${state.teams[state.winner]} venceu ${state.scores[0]} × ${state.scores[1]}!`
                : 'Fim da partida.'}
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {state.phase === 'reveal' ? (
            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              {state.winner !== null ? 'Ver resultado' : 'Próxima rodada'}
            </button>
          ) : null}
          {state.phase === 'over' ? (
            <button
              type="button"
              onClick={onNew}
              className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              <RotateCcw className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              Nova partida
            </button>
          ) : null}
          <button
            type="button"
            onClick={onEnd}
            className="rounded-xl border-2 border-[var(--line)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)]"
          >
            <Square className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
            Encerrar
          </button>
        </div>
      </div>
    </div>
  );
}
