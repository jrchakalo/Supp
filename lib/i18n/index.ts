import { CLASSIC_EN } from './classic-en';
import { CLASSIC_LIVE_PT } from './classic-live-pt';
import { CLASSIC_PT } from './classic-pt';
import { HALLOWEEN_PT } from './halloween-pt';
import { LIVE_PT } from './live-pt';
import type { Language } from './types';
import type { LiveQuestion, Question } from '../types';

/**
 * Localizes a true-or-false question.
 *
 * The classic deck is written in Portuguese and the Halloween deck in English,
 * so each one uses the opposite map when the player picks the other language.
 */
export function localizeQuestion(question: Question, language: Language): Question {
  if (language === 'pt' && question.id.startsWith('hw-')) {
    const translation = HALLOWEEN_PT[question.id];
    if (translation) {
      return {
        ...question,
        text: translation.text,
        explanation: translation.explanation ?? question.explanation,
      };
    }
  }

  if (language === 'pt' && question.id.startsWith('classic-')) {
    const translation = CLASSIC_PT[question.id];
    if (translation) {
      return { ...question, text: translation.text };
    }
  }

  if (language === 'en' && question.id.startsWith('classic-')) {
    const translation = CLASSIC_EN[question.id];
    if (translation) {
      return { ...question, text: translation.text };
    }
  }

  return question;
}

/** Localizes a multiple-choice question, keeping the option order intact. */
export function localizeLiveQuestion(
  question: LiveQuestion,
  language: Language
): LiveQuestion {
  if (language === 'pt') {
    const translation = question.id.startsWith('clq-')
      ? CLASSIC_LIVE_PT[question.id]
      : LIVE_PT[question.id];

    if (translation) {
      return {
        ...question,
        text: translation.text,
        options: translation.options,
        explanation: translation.explanation ?? question.explanation,
      };
    }
  }

  return question;
}

export function localizeQuestions(
  questions: Question[],
  language: Language
): Question[] {
  return questions.map((question) => localizeQuestion(question, language));
}

export function localizeLiveQuestions(
  questions: LiveQuestion[],
  language: Language
): LiveQuestion[] {
  return questions.map((question) => localizeLiveQuestion(question, language));
}

export type { Language } from './types';
