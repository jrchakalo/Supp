'use client';

import { Play, RotateCcw, Square, Trophy } from 'lucide-react';
import type { WheelGameState } from '@/lib/aula/games';

type WheelControlProps = {
  state: WheelGameState;
  onSpin: () => void;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
  onEnd: () => void;
};

export default function WheelControl({
  state,
  onSpin,
  onAnswer,
  onNext,
  onEnd,
}: WheelControlProps) {
  return (
    <div className="mt-3 rounded-2xl border-2 border-[var(--accent)]/60 bg-[var(--surface)] px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-sm font-black">
            <RotateCcw className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            Roleta na TV
            <span className="text-xs font-semibold text-[var(--muted)]">
              {state.rounds === null
                ? `rodada ${state.round} · ∞`
                : `rodada ${state.round} de ${state.rounds}`}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--accent)]">
              <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
              {state.score.correct}/{state.score.total}
            </span>
          </p>

          {state.phase === 'question' ? (
            <>
              <p className="mt-1 text-base font-black leading-snug">{state.question?.text}</p>
              <p className="mt-1 text-xs font-bold text-[var(--muted)]">
                Resposta: {state.question?.answer ? 'VERDADEIRO' : 'FALSO'}
                {state.question?.explanation ? ` · ${state.question.explanation}` : ''}
              </p>
            </>
          ) : state.phase === 'revealed' ? (
            <p className="mt-1 text-sm font-black text-[var(--muted)]">
              {state.lastAnswerCorrect ? 'Acertou!' : 'Errou.'} Clique em “Próxima rodada”.
            </p>
          ) : state.phase === 'spinning' ? (
            <p className="mt-1 text-sm font-bold text-[var(--muted)]">Girando na TV…</p>
          ) : state.phase === 'over' ? (
            <p className="mt-1 text-sm font-black text-[var(--accent)]">
              Fim da roleta: {state.score.correct}/{state.score.total}.
            </p>
          ) : (
            <p className="mt-1 text-sm font-semibold text-[var(--muted)]">
              Clique na roleta na TV ou no botão Girar.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {state.phase === 'idle' ? (
            <button
              type="button"
              onClick={onSpin}
              className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              <Play className="mr-1 inline h-3.5 w-3.5" aria-hidden="true" />
              Girar
            </button>
          ) : null}
          {state.phase === 'question' ? (
            <>
              <button
                type="button"
                onClick={() => onAnswer(true)}
                className="rounded-xl bg-emerald-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-[#071018]"
              >
                Acertou
              </button>
              <button
                type="button"
                onClick={() => onAnswer(false)}
                className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-black uppercase tracking-wide text-white"
              >
                Errou
              </button>
            </>
          ) : null}
          {state.phase === 'revealed' || (state.phase === 'over' && state.round > 0) ? (
            <button
              type="button"
              onClick={onNext}
              className="rounded-xl border-2 border-[var(--line)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)]"
            >
              {state.phase === 'over' ? 'Nova roleta' : 'Próxima'}
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
