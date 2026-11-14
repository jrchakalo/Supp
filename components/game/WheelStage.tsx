'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import confetti from 'canvas-confetti';
import { Sparkles, Trophy } from 'lucide-react';
import type { ClassicCategoryId } from '@/lib/types';
import type { WheelGameState } from '@/lib/aula/games';
import { categoryCopy } from '@/lib/i18n/game-copy';

const WHEEL_COLORS = [
  '#e21b3c',
  '#1368ce',
  '#d89e00',
  '#26890c',
  '#7c3aed',
  '#0e7490',
  '#b45309',
  '#be185d',
  '#4338ca',
  '#047857',
];

const SHORT_LABELS: Record<ClassicCategoryId, string> = {
  games: 'Jogos',
  anime: 'Anime',
  'pop-culture': 'Cultura pop',
  tech: 'Tecnologia',
  'digital-safety': 'Segurança',
  science: 'Ciência',
  nature: 'Natureza',
  brazil: 'Brasil',
  sports: 'Esportes',
  logic: 'Lógica',
};

function polar(cx: number, cy: number, radius: number, angle: number) {
  const radians = ((angle - 90) * Math.PI) / 180;
  return [cx + radius * Math.cos(radians), cy + radius * Math.sin(radians)] as const;
}

type WheelStageProps = {
  state: WheelGameState;
  onSpin: () => void;
  onAnswer?: (answer: boolean) => void;
};

export default function WheelStage({ state, onSpin, onAnswer }: WheelStageProps) {
  const categoryCount = Math.max(1, state.categories.length);
  const segmentAngle = 360 / categoryCount;
  const segments = state.categories.map((category, index) => {
    const start = index * segmentAngle;
    const end = (index + 1) * segmentAngle;
    const [x1, y1] = polar(50, 50, 46, start);
    const [x2, y2] = polar(50, 50, 46, end);
    const mid = start + segmentAngle / 2;
    const [tx, ty] = polar(50, 50, 31, mid);
    return {
      category,
      color: WHEEL_COLORS[index % WHEEL_COLORS.length],
      path: `M50 50 L ${x1.toFixed(3)} ${y1.toFixed(3)} A 46 46 0 ${segmentAngle > 180 ? 1 : 0} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`,
      label: SHORT_LABELS[category] ?? categoryCopy(category, 'pt').label,
      textX: tx,
      textY: ty,
      mid,
    };
  });

  const celebratedRef = useRef(-1);
  useEffect(() => {
    if (
      state.phase === 'revealed' &&
      state.lastAnswerCorrect === true &&
      celebratedRef.current !== state.spinId
    ) {
      celebratedRef.current = state.spinId;
      confetti({
        particleCount: 90,
        spread: 75,
        origin: { y: 0.65 },
        colors: ['#ffd166', '#4cc9f0', '#22c55e', '#f472b6'],
      });
    }
  }, [state.phase, state.lastAnswerCorrect, state.spinId]);

  const canSpin = state.phase === 'idle';
  const pickedLabel = state.picked
    ? SHORT_LABELS[state.picked] ?? categoryCopy(state.picked, 'pt').label
    : null;

  return (
    <div className="flex h-full flex-col px-4 py-3 sm:px-6 sm:py-4">
      <header className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] px-4 py-2.5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
            Roleta
          </p>
          <h1 className="mt-0.5 text-xl font-black">Gire e responda</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[var(--muted)]">
            {state.rounds === null
              ? `Rodada ${state.round} · ∞`
              : `Rodada ${state.round} de ${state.rounds}`}
          </span>
          <span className="flex items-center gap-1.5 rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-xs font-black text-[var(--ink)]">
            <Trophy className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
            {state.score.correct}/{state.score.total}
          </span>
        </div>
      </header>

      <div className="mt-3 grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="flex min-h-0 items-center justify-center rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-3">
          <div className="relative aspect-square w-full max-w-[min(54vh,620px)]">
            <div className="absolute left-1/2 top-0 z-20 -translate-x-1/2 -translate-y-1">
              <div className="h-0 w-0 border-x-[16px] border-t-[30px] border-x-transparent border-t-[var(--accent)] drop-shadow" />
            </div>

            <button
              type="button"
              onClick={canSpin ? onSpin : undefined}
              disabled={!canSpin}
              aria-label="Girar a roleta"
              className="block h-full w-full rounded-full disabled:cursor-default"
            >
              <motion.div
                className="h-full w-full"
                animate={{ rotate: state.rotation }}
                transition={
                  state.phase === 'spinning'
                    ? { duration: 3.1, ease: [0.12, 0.72, 0.12, 1] }
                    : { duration: 0 }
                }
              >
                <svg
                  viewBox="0 0 100 100"
                  role="img"
                  aria-label="Roleta de temas"
                  className="h-full w-full drop-shadow-xl"
                >
                  <circle cx="50" cy="50" r="47.5" fill="var(--line)" />
                  {segments.length === 1 ? (
                    <circle cx="50" cy="50" r="46" fill={segments[0].color} />
                  ) : (
                    segments.map((segment) => (
                      <path
                        key={segment.category}
                        d={segment.path}
                        fill={segment.color}
                        stroke="rgba(255,255,255,0.8)"
                        strokeWidth="0.45"
                      />
                    ))
                  )}
                  {segments.map((segment) => (
                    <text
                      key={`${segment.category}-label`}
                      x={segment.textX}
                      y={segment.textY}
                      fill="#ffffff"
                      fontSize={categoryCount > 8 ? 2.7 : 3.3}
                      fontWeight="900"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${segment.mid} ${segment.textX} ${segment.textY})`}
                      style={{
                        paintOrder: 'stroke',
                        stroke: 'rgba(0,0,0,0.25)',
                        strokeWidth: 0.25,
                      }}
                    >
                      {segment.label}
                    </text>
                  ))}
                  <circle
                    cx="50"
                    cy="50"
                    r="10"
                    fill="var(--surface)"
                    stroke="var(--line)"
                    strokeWidth="1.4"
                  />
                  <circle cx="50" cy="50" r="6.5" fill="var(--cta-bg)" />
                </svg>
              </motion.div>
            </button>
          </div>
        </section>

        <section className="flex min-h-0 flex-col justify-center rounded-3xl border-2 border-[var(--line)] bg-[var(--surface)] p-5">
          {state.phase === 'over' ? (
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                Fim da roleta
              </p>
              <h2 className="mt-2 text-4xl font-black">Fim!</h2>
              <p className="mt-2 text-lg font-bold text-[var(--muted)]">
                {state.score.correct} de {state.score.total} corretas
              </p>
            </div>
          ) : state.phase === 'question' || state.phase === 'revealed' ? (
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                {pickedLabel ?? 'Pergunta'}
              </p>
              <h2 className="mt-2 text-2xl font-black leading-tight">
                {state.question?.text ?? 'Sem pergunta'}
              </h2>
              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => onAnswer?.(true)}
                  disabled={state.revealed || !onAnswer}
                  className={`rounded-2xl border-2 px-4 py-3 text-center text-lg font-black transition disabled:cursor-default ${
                    state.revealed && state.question?.answer === true
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                      : 'border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]'
                  }`}
                >
                  VERDADEIRO
                </button>
                <button
                  type="button"
                  onClick={() => onAnswer?.(false)}
                  disabled={state.revealed || !onAnswer}
                  className={`rounded-2xl border-2 px-4 py-3 text-center text-lg font-black transition disabled:cursor-default ${
                    state.revealed && state.question?.answer === false
                      ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                      : 'border-[var(--line-soft)] bg-[var(--surface-2)] text-[var(--muted)] hover:border-[var(--accent)] hover:text-[var(--ink)]'
                  }`}
                >
                  FALSO
                </button>
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
                  Clique em VERDADEIRO ou FALSO na TV. A próxima rodada começa sozinha.
                </p>
              )}
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
                {state.phase === 'spinning' ? 'Sorteando…' : 'Roleta'}
              </p>
              <h2 className="mt-2 text-3xl font-black leading-tight">
                {state.phase === 'spinning' ? 'Girando…' : 'Clique na roleta'}
              </h2>
              <p className="mt-2 text-sm font-semibold text-[var(--muted)]">
                {state.phase === 'spinning'
                  ? 'A categoria está sendo sorteada.'
                  : 'A TV gira; a pergunta aparece aqui.'}
              </p>
              {canSpin ? (
                <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1.5 text-[11px] font-black uppercase tracking-wide text-[var(--accent)]">
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                  Clique na roleta
                </div>
              ) : null}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
