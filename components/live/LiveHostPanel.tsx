'use client';

import { QRCodeSVG } from 'qrcode.react';
import { Play, Radio, SkipForward, Square, Timer, Trophy, Users } from 'lucide-react';
import type { LiveHost } from '@/lib/live/useLiveHost';

function formatPoints(points: number) {
  return points.toLocaleString('pt-BR');
}

export default function LiveHostPanel({
  host,
  onExit,
}: {
  host: LiveHost;
  onExit: () => void;
}) {
  const { phase, question, reveal, players, msLeft, answered, code } = host;
  const secondsLeft = Math.ceil(msLeft / 1000);

  return (
    <section
      className="mt-3 rounded-2xl border-2 border-[var(--accent-2)]/70 bg-[var(--surface)] px-4 py-3"
      aria-label="Live embutido no professor"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-black">
            <Radio className="h-4 w-4 text-[var(--accent-2)]" aria-hidden="true" />
            Live na sala {code ?? '—'}
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]">
              {host.status === 'live'
                ? 'conectado'
                : host.status === 'connecting'
                  ? 'conectando'
                  : 'fechado'}
            </span>
            <span className="inline-flex items-center gap-1 text-xs font-bold text-[var(--muted)]">
              <Users className="h-3.5 w-3.5" aria-hidden="true" />
              {players.length} aluno{players.length === 1 ? '' : 's'}
            </span>
          </p>
          {phase === 'lobby' ? (
            <p className="mt-1 text-xs font-semibold text-[var(--muted)]">
              Alunos entram em supp.lol/join com o código {code}. O telão mostra o QR.
            </p>
          ) : null}
          {phase === 'question' && question ? (
            <p className="mt-1 text-xs font-bold text-[var(--muted)]">
              Resposta: {question.options[question.correctIndex]} · {answered}/
              {players.length} responderam
            </p>
          ) : null}
          {phase === 'reveal' && reveal ? (
            <p className="mt-1 text-xs font-bold text-[var(--muted)]">
              {reveal.leaderboard[0]
                ? `Lider: ${reveal.leaderboard[0].name} · ${formatPoints(
                    reveal.leaderboard[0].total
                  )}`
                : 'Sem respostas.'}
            </p>
          ) : null}
          {phase === 'over' ? (
            <p className="mt-1 text-xs font-black text-[var(--accent)]">
              Pódio no telão — {host.finalLeaderboard[0]?.name ?? 'sem vencedor'}
              {host.finalLeaderboard[0]
                ? ` · ${formatPoints(host.finalLeaderboard[0].total)}`
                : ''}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {phase === 'lobby' ? (
            <button
              type="button"
              onClick={host.startGame}
              disabled={players.length === 0 || host.status !== 'live'}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)] disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" aria-hidden="true" />
              Começar quiz
            </button>
          ) : null}
          {phase === 'question' ? (
            <button
              type="button"
              onClick={host.endQuestion}
              className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              Encerrar pergunta
            </button>
          ) : null}
          {phase === 'reveal' ? (
            <button
              type="button"
              onClick={host.nextQuestion}
              className="flex items-center gap-1.5 rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              <SkipForward className="h-3.5 w-3.5" aria-hidden="true" />
              {host.seq + 1 >= host.total ? 'Ver pódio' : 'Próxima'}
            </button>
          ) : null}
          {phase === 'over' ? (
            <button
              type="button"
              onClick={onExit}
              className="rounded-xl bg-[var(--cta-bg)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--cta-text)]"
            >
              Voltar aos slides
            </button>
          ) : null}
          <button
            type="button"
            onClick={onExit}
            className="flex items-center gap-1.5 rounded-xl border-2 border-[var(--line)] px-3 py-2 text-xs font-black uppercase tracking-wide text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            <Square className="h-3.5 w-3.5" aria-hidden="true" />
            Encerrar live
          </button>
        </div>
      </div>

      {phase === 'lobby' ? (
        <div className="mt-3 flex flex-wrap items-start gap-4">
          {host.joinUrl ? (
            <div className="rounded-xl bg-white p-2">
              <QRCodeSVG value={host.joinUrl} size={104} fgColor="#0b1020" bgColor="#ffffff" />
            </div>
          ) : null}
          <div className="min-w-0 flex-1">
            <p className="break-all text-[11px] font-semibold text-[var(--muted)]">
              {host.joinUrl || 'Abrindo a sala…'}
            </p>
            <ul className="mt-2 flex flex-wrap gap-1.5">
              {players.map((player) => (
                <li
                  key={player.id}
                  className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-2 py-0.5 text-[11px] font-black text-[var(--ink)]"
                >
                  {player.name}
                </li>
              ))}
              {players.length === 0 ? (
                <li className="text-[11px] font-semibold text-[var(--muted)]">
                  Aguardando alunos entrarem…
                </li>
              ) : null}
            </ul>
          </div>
        </div>
      ) : null}

      {phase === 'question' && question ? (
        <div className="mt-3">
          <div className="h-2 overflow-hidden rounded-full bg-[var(--surface-2)]">
            <div
              className="h-full rounded-full bg-[var(--accent)] transition-[width] duration-200"
              style={{
                width: `${Math.max(
                  0,
                  Math.min(1, msLeft / Math.max(host.secondsPerQuestion * 1000, 1))
                ) * 100}%`,
              }}
            />
          </div>
          <div className="mt-2 flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-black leading-snug">{question.text}</p>
              <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
                {question.options.map((option, index) => (
                  <span
                    key={`${option}-${index}`}
                    className={
                      index === question.correctIndex
                        ? 'mr-2 font-black text-emerald-400'
                        : 'mr-2'
                    }
                  >
                    {index + 1}. {option}
                  </span>
                ))}
              </p>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-sm font-black text-[var(--accent-2)]">
              <Timer className="h-4 w-4" aria-hidden="true" />
              {secondsLeft}s
            </span>
          </div>
        </div>
      ) : null}

      {phase === 'reveal' && reveal ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2">
            <p className="text-[11px] font-black uppercase tracking-wide text-emerald-400">
              Resposta certa
            </p>
            <p className="mt-1 text-sm font-black">
              {question?.options[reveal.correctIndex] ?? '—'}
            </p>
            <p className="mt-1 text-[11px] font-semibold text-[var(--muted)]">
              {reveal.explanation}
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {question?.options.map((option, index) => (
                <span
                  key={`${option}-${index}`}
                  className={
                    index === reveal.correctIndex
                      ? 'rounded-full border border-emerald-400/60 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-black text-emerald-300'
                      : 'rounded-full border border-[var(--line-soft)] bg-[var(--surface)] px-2 py-0.5 text-[11px] font-bold text-[var(--muted)]'
                  }
                >
                  {reveal.counts[index] ?? 0}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-2">
            <p className="flex items-center justify-between text-[11px] font-black uppercase tracking-wide text-[var(--muted)]">
              <span className="inline-flex items-center gap-1">
                <Trophy className="h-3.5 w-3.5" aria-hidden="true" />
                Placar
              </span>
              {host.autoAdvance ? (
                <span className="text-[var(--accent)]">próxima em {host.revealCountdown}s</span>
              ) : null}
            </p>
            <ol className="mt-1 space-y-0.5">
              {reveal.leaderboard.slice(0, 5).map((row, index) => (
                <li key={row.playerId} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right font-black text-[var(--accent)]">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-bold">{row.name}</span>
                  <span className="font-black text-[var(--muted)]">
                    {row.total.toLocaleString('pt-BR')}
                  </span>
                </li>
              ))}
            </ol>
            <button
              type="button"
              onClick={host.toggleAutoAdvance}
              className="mt-2 rounded-lg border border-[var(--line-soft)] px-2 py-1 text-[10px] font-black uppercase tracking-wide text-[var(--muted)]"
            >
              Auto {host.autoAdvance ? 'ligado' : 'desligado'}
            </button>
          </div>
        </div>
      ) : null}

      {phase === 'over' ? (
        <ol className="mt-3 space-y-1">
          {host.finalLeaderboard.slice(0, 5).map((row, index) => (
            <li key={row.playerId} className="flex items-center gap-2 text-sm">
              <span className="w-5 text-right font-black text-[var(--accent)]">{index + 1}</span>
              <span className="min-w-0 flex-1 truncate font-black">{row.name}</span>
              <span className="font-black text-[var(--muted)]">
                {row.total.toLocaleString('pt-BR')}
              </span>
            </li>
          ))}
        </ol>
      ) : null}
    </section>
  );
}
