import type { Slide } from '@/lib/passaporte-lessons';
import { PASSAPORTE_DECKS } from '@/lib/passaporte-decks';

/**
 * The quiz "without phones" runs as a slide deck: every question becomes two
 * slides — the question itself and the answer with the correct option +
 * explanation. `/professor` broadcasts these as `{ type: 'slide', lessonId: 'quiz', slide }`
 * and `/tela` simply renders the slide it receives.
 */

export const QUIZ_LESSON_ID = 'quiz';

export function buildQuizSlides(deckId: string): Slide[] {
  const deck = PASSAPORTE_DECKS[deckId];
  if (!deck) return [];

  const total = deck.questions.length;
  const slides: Slide[] = [];

  deck.questions.forEach((question, index) => {
    const number = index + 1;

    slides.push({
      kind: 'question',
      title: `Pergunta ${number} de ${total}`,
      subtitle: 'Escolha uma opção',
      question: question.text,
      options: question.options,
      textPt: question.textPt,
      optionsPt: question.optionsPt,
      translationDelayMs: 10000,
    });

    slides.push({
      kind: 'answer',
      title: `Resposta · ${number} de ${total}`,
      subtitle: 'Confira a explicação',
      question: question.text,
      options: question.options,
      correctIndex: question.correctIndex,
      explanation: question.explanation,
      textPt: question.textPt,
      optionsPt: question.optionsPt,
      translationDelayMs: 0,
    });
  });

  return slides;
}
