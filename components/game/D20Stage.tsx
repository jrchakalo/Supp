'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Dices, Trophy } from 'lucide-react';
import type { D20GameState } from '@/lib/aula/games';

export default function D20Stage({ state }: { state: D20GameState }) {
  const celebratedRef = useRef(-1);
  useEffect(() => {
    if (
      state.phase === 'revealed' &&
      state.lastAnswerCorrect === true &&
      celebratedRef.current !== state.round
    ) {
      celebratedRef.current = state.round;
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#ffd166', '#4cc9f0', '#22c55e', '#f472b6'],
      });
    }
  }, [state.phase, state.lastAnswerCorrect, state.round]);

  return (
    <div className="flex h-full flex-col px-4 py-3 sm:px-6 sm:py-4">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            D20
          </p>
          <h1 className="mt-0.5 text-xl font-black">Role, responda e pontue</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)]">
            Rodada {state.round}/{state.maxRounds}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-black text-[var(--accent)]">
            <Trophy className="h-4 w-4" aria-hidden="true" />
            {state.score.correct}/{state.score.total}
          </span>
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-black text-[var(--muted)]">
            seq {state.streak} · best {state.bestStreak}
          </span>
        </div>
      </header>

      <div className="mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-3">
          <div className="grid grid-cols-4 grid-rows-5 gap-2">
            {Array.from({ length: 20 }, (_, index) => index + 1).map((number) => {
              const active = state.number === number;
              return (
                <motion.div
                  key={number}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: number * 0.015 }}
                  className={`flex aspect-square items-center justify-center rounded-2xl border-2 text-[clamp(1.2rem,2.4vw,2.4rem)] font-black ${
                    active
                      ? 'border-[var(--accent)] bg-[var(--accent)] text-[#071018] shadow-[0_0_28px_rgba(255,209,102,0.45)]'
                      : 'border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--ink)]'
                  }`}
                >
                  {number}
                </motion.div>
              );
            })}
          </div>
        </section>

        <section className="flex min-h-0 flex-col justify-center rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5">
          {state.phase === 'over' ? (
            <div className="text-center">
              <Dices className="mx-auto h-14 w-14 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="mt-3 text-4xl font-black">Fim do D20</h2>
              <p className="mt-2 text-lg font-bold text-[var(--muted)]">
                {state.score.correct} de {state.score.total} · melhor sequência {state.bestStreak}
              </p>
            </div>
          ) : state.phase === 'question' || state.phase === 'revealed' ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                Número {state.number ?? '—'}
              </p>
              <h2 className="mt-2 text-[clamp(1.3rem,2.6vw,2.2rem)] font-black leading-tight">
                {state.question?.text ?? 'Sem pergunta'}
              </h2>
              <div className="mt-5 grid grid-cols-2 gap-2">
                <div
                  className={`rounded-2xl border-2 px-4 py-3 text-center text-lg font-black ${
                    state.revealed && state.question?.answer === true
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                      : 'border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--muted)]'
                  }`}
                >
                  VERDADEIRO
                </div>
                <div
                  className={`rounded-2xl border-2 px-4 py-3 text-center text-lg font-black ${
                    state.revealed && state.question?.answer === false
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                      : 'border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--muted)]'
                  }`}
                >
                  FALSO
                </div>
              </div>
              {state.revealed ? (
                <div className="mt-4 rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-2)] px-4 py-3">
                  <p
                    className={`text-sm font-black ${
                      state.lastAnswerCorrect ? 'text-emerald-300' : 'text-rose-300'
                    }`}
                  >
                    {state.lastAnswerCorrect ? 'Acertou!' : 'Errou.'}
                  </p>
                  {state.question?.explanation ? (
                    <p className="mt-1 text-xs font-semibold leading-snug text-[var(--muted)]">
                      {state.question.explanation}
                    </p>
                  ) : null}
                </div>
              ) : (
                <p className="mt-4 text-xs font-semibold text-[var(--muted)]">
                  O professor marca a resposta no notebook.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <Dices className="mx-auto h-14 w-14 text-[var(--accent)]" aria-hidden="true" />
              <h2 className="mt-3 text-3xl font-black">Escolha um número</h2>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                O professor sorteia/rola o D20 no notebook; a pergunta aparece aqui.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
