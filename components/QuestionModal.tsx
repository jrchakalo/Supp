'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getDifficultyMeta } from '@/lib/game';
import { localizeQuestion, type Language } from '@/lib/i18n';
import type { AnswerStatus, DifficultyId, ModeId, Question } from '@/lib/types';

type QuestionModalProps = {
  question: Question;
  diceNumber?: number;
  studentName?: string;
  phaseLabel?: string;
  mode: ModeId;
  difficulty: DifficultyId;
  language: Language;
  status: AnswerStatus;
  continueLabel?: string;
  onAnswer: (guess: boolean) => void;
  onClose: () => void;
};

export default function QuestionModal({
  question,
  diceNumber,
  studentName,
  phaseLabel,
  mode,
  difficulty,
  language,
  status,
  continueLabel,
  onAnswer,
  onClose,
}: QuestionModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const isHalloween = mode === 'halloween';
  const difficultyMeta = getDifficultyMeta(difficulty);
  const localized = localizeQuestion(question, language);
  const t = (en: string, pt: string) => (language === 'pt' ? pt : en);

  useEffect(() => {
    dialogRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (status) {
        if (event.key === 'Enter') {
          event.preventDefault();
          onClose();
        }
        return;
      }

      const key = event.key.toLowerCase();
      if (key === 't' || key === 'v') {
        event.preventDefault();
        onAnswer(true);
      }
      if (key === 'f') {
        event.preventDefault();
        onAnswer(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onAnswer, onClose, status]);

  const isCorrect = status === 'correct';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        'fixed inset-0 z-[100] flex items-center justify-center p-3 backdrop-blur-sm sm:p-6',
        isCorrect && 'bg-emerald-500/20',
        status === 'incorrect' && 'bg-rose-600/20',
        !status && (isHalloween ? 'bg-[#05020b]/85' : 'bg-[#073B4C]/90')
      )}
    >
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="question-text"
        tabIndex={-1}
        initial={{ y: 46, scale: 0.97 }}
        animate={
          status === 'incorrect'
            ? { y: 0, scale: 1, x: [-9, 9, -7, 7, 0] }
            : { y: 0, scale: 1, x: 0 }
        }
        exit={{ y: 40, opacity: 0 }}
        transition={{ type: 'tween', duration: 0.2 }}
        className={cn(
          'relative flex max-h-full w-full max-w-2xl flex-col gap-5 overflow-y-auto overscroll-contain rounded-[28px] border-4 p-5 outline-none sm:gap-6 sm:p-8',
          'bg-[var(--surface)] text-[var(--ink)] border-[var(--line)] shadow-[var(--card-shadow)]'
        )}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close question"
          className="absolute right-3 top-3 rounded-full border-2 border-[var(--line-soft)] p-1.5 text-[var(--muted)] transition hover:scale-105 hover:text-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:right-4 sm:top-4"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        <div className="flex flex-wrap items-center gap-2 pr-9 text-[11px] font-bold uppercase tracking-wider sm:text-xs">
          {studentName && (
            <span className="rounded-full border border-[var(--accent)] bg-[var(--surface-2)] px-3 py-1 text-[var(--accent)]">
              {studentName}
            </span>
          )}
          {diceNumber !== undefined && (
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1 text-[var(--muted)]">
              {t('Roll', 'Rolagem')} #{diceNumber}
            </span>
          )}
          <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1 text-[var(--muted)]">
            {isHalloween ? 'Halloween' : t('Classic', 'Clássico')}
          </span>
          {phaseLabel ? (
            <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1 text-[var(--accent)]">
              {phaseLabel}
            </span>
          ) : (
            isHalloween && (
              <span className="rounded-full border border-[var(--line-soft)] bg-[var(--surface-2)] px-3 py-1 text-[var(--accent)]">
                {language === 'pt'
                  ? { easy: 'Fácil', medium: 'Médio', hard: 'Difícil' }[difficulty]
                  : difficultyMeta.label}
              </span>
            )
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--muted)]">
            {isHalloween
              ? t('Is this treat or trick?', 'É doce ou travessura?')
              : t('True or false?', 'Verdadeiro ou falso?')}
          </p>
          <h2
            id="question-text"
            className="text-balance text-xl font-extrabold leading-snug sm:text-3xl sm:leading-tight"
          >
            {localized.text}
          </h2>
        </div>

        {!status && (
          <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
            <motion.button
              type="button"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onAnswer(true)}
              className="group relative flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--accent-2)] px-4 text-lg font-black uppercase tracking-wide text-[#052e1f] shadow-[0_6px_0_rgba(0,0,0,0.18)] transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] active:translate-y-1 active:shadow-none sm:text-xl"
            >
              <Check className="h-5 w-5" aria-hidden="true" />
              {t('True', 'Verdadeiro')}
              <kbd className="absolute right-3 top-2 rounded border border-[#052e1f]/25 px-1.5 text-[10px] font-bold opacity-60">
                T
              </kbd>
            </motion.button>

            <motion.button
              type="button"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onAnswer(false)}
              className="group relative flex min-h-[64px] items-center justify-center gap-2 rounded-2xl border-4 border-[var(--line)] bg-[var(--danger)] px-4 text-lg font-black uppercase tracking-wide text-white shadow-[0_6px_0_rgba(0,0,0,0.18)] transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] active:translate-y-1 active:shadow-none sm:text-xl"
            >
              <X className="h-5 w-5" aria-hidden="true" />
              {t('False', 'Falso')}
              <kbd className="absolute right-3 top-2 rounded border border-white/30 px-1.5 text-[10px] font-bold opacity-60">
                F
              </kbd>
            </motion.button>
          </div>
        )}

        {status && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            aria-live="polite"
            className="flex flex-col gap-4"
          >
            <div
              className={cn(
                'rounded-2xl border-2 p-4 sm:p-5',
                isCorrect
                  ? 'border-emerald-400/60 bg-emerald-400/10'
                  : 'border-rose-500/60 bg-rose-500/10'
              )}
            >
              <div className="flex items-start gap-3">
                <span
                  className={cn(
                    'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2',
                    isCorrect
                      ? 'border-[var(--accent-2)] text-[var(--accent-2)]'
                      : 'border-[var(--danger)] text-[var(--danger)]'
                  )}
                >
                  {isCorrect ? (
                    <Check className="h-5 w-5" aria-hidden="true" />
                  ) : (
                    <X className="h-5 w-5" aria-hidden="true" />
                  )}
                </span>
                <div>
                  <h3
                    className={cn(
                      'text-2xl font-black uppercase leading-none sm:text-3xl',
                      isCorrect ? 'text-[var(--accent-2)]' : 'text-[var(--danger)]'
                    )}
                  >
                    {isCorrect ? t('Correct!', 'Acertou!') : t('Not quite...', 'Quase...')}
                  </h3>
                  <p className="mt-2 text-sm text-[var(--muted)] sm:text-base">
                    {isCorrect
                      ? isHalloween
                        ? t(
                            'Sweet! That was a real Halloween treat.',
                            'Doce! Essa foi uma verdadeira travessura de Halloween.'
                          )
                        : t('Nice work! You got it right.', 'Boa! Você acertou.')
                      : t('The correct answer is below.', 'A resposta correta está abaixo.')}
                  </p>
                </div>
              </div>

              <p className="mt-3 rounded-xl bg-[var(--surface-2)] px-3 py-2 text-base font-bold sm:text-lg">
                {t('The answer is', 'A resposta é')}{' '}
                <span className={question.answer ? 'text-[var(--accent-2)]' : 'text-[var(--danger)]'}>
                  {question.answer ? t('TRUE', 'VERDADEIRO') : t('FALSE', 'FALSO')}
                </span>
                .
              </p>

              {localized.explanation && (
                <p className="mt-2 rounded-xl border-2 border-[var(--line-soft)] px-3 py-2 text-sm font-medium leading-relaxed text-[var(--muted)] sm:text-base">
                  <span className="font-black uppercase tracking-wider text-[var(--accent)]">
                    {t('Did you know?', 'Você sabia?')}{' '}
                  </span>
                  {localized.explanation}
                </p>
              )}
            </div>

            <motion.button
              type="button"
              whileHover={{ scale: 1.015 }}
              whileTap={{ scale: 0.97 }}
              onClick={onClose}
              className="min-h-[56px] rounded-2xl border-4 border-[var(--line)] bg-[var(--cta-bg)] px-6 text-lg font-black uppercase tracking-wide text-[var(--cta-text)] shadow-[0_6px_0_rgba(0,0,0,0.2)] transition focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)] active:translate-y-1 active:shadow-none"
            >
              {continueLabel ?? t('Continue', 'Continuar')}
            </motion.button>
          </motion.div>
        )}

        <p className="text-center text-[11px] font-semibold uppercase tracking-wider text-[var(--muted)]">
          {t(
            'Press T or F to answer · Esc to close',
            'Pressione T ou F para responder · Esc para fechar'
          )}
        </p>
      </motion.div>
    </motion.div>
  );
}
