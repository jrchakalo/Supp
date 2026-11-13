'use client';

import { Dices, RotateCcw, Square, Trophy } from 'lucide-react';
import type { D20GameState } from '@/lib/aula/games';

type D20ControlProps = {
  state: D20GameState;
  onPick: (number: number) => void;
  onRandom: () => void;
  onReveal: (correct: boolean) => void;
  onNext: () => void;
  onNew: () => void;
  onEnd: () => void;
};

export default function D20Control({
  state,
  onPick,
  onRandom,
  onReveal,
  onNext,
  onNew,
  onEnd,
}: D20ControlProps) {
  return (
    <div
      className="mt-3 rounded-2xl border-2 border-[var(--accent)]/60 bg-[var(--surface)] px-4 py-3"
      role="region"
      aria-label="D20 na TV"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-black">
            <Dices className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            D20 na TV
            <span className="text-xs font-semibold text-[var(--muted)]">
              rodada {state.round}/{state.maxRounds}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)]">
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              {state.score.correct}/{state.score.total}
            </span>
            <span className="text-xs font-semibold text-[var(--muted)]">
              seq {state.streak} · best {state.bestStreak}
            </span>
          </p>

          {state.phase === 'question' ? (
            <>
              <p className="mt-1 text-sm font-black">
                Número {state.number} · {state.question?.text}
              </p>
              <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                Resposta: {state.question?.answer ? 'VERDADEIRO' : 'FALSO'}
                {state.question?.explanation ? ` · ${state.question.explanation}` : ''}
              </p>
            </>
          ) : state.phase === 'revealed' ? (
            <p className="mt-1 text-sm font-black text-[var(--muted)]">
              {state.lastAnswerCorrect ? 'Acertou!' : 'Errou.'} Clique em “Próxima”.
            </p>
          ) : state.phase === 'over' ? (
            <p className="mt-1 text-sm font-black text-[var(--accent)]">
              Fim: {state.score.correct}/{state.score.total} · melhor sequência{' '}
              {state.bestStreak}.
            </p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
              Clique em um número ou role o D20.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {state.phase === 'board' ? (
            <button
              type="button"
              onClick={onRandom}
              className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              <Dices className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              Rolar D20
            </button>
          ) : null}
          {state.phase === 'question' ? (
            <>
              <button
                type="button"
                onClick={() => onReveal(true)}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#071018]"
              >
                Acertou
              </button>
              <button
                type="button"
                onClick={() => onReveal(false)}
                className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-white"
              >
                Errou
              </button>
            </>
          ) : null}
          {state.phase === 'revealed' ? (
            <button
              type="button"
              onClick={onNext}
              className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              {state.round >= state.maxRounds ? 'Ver resultado' : 'Próxima'}
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

      {state.phase === 'board' ? (
        <div className="mt-3 grid grid-cols-10 gap-1">
          {Array.from({ length: 20 }, (_, index) => index + 1).map((number) => (
            <button
              key={number}
              type="button"
              onClick={() => onPick(number)}
              className="rounded-lg border border-[var(--line-soft)] bg-[var(--surface-2)] py-1.5 text-[11px] font-black text-[var(--ink)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              {number}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
