/** Languages supported by the question decks and game screens. */
export type Language = 'en' | 'pt';

/** Translation of a true-or-false question. */
export type QuestionTranslation = {
  text: string;
  explanation?: string;
};

/**
 * Translation of a multiple-choice question.
 * `options` must stay in the same order as the canonical options so the
 * canonical `correctIndex` remains valid.
 */
export type LiveQuestionTranslation = {
  text: string;
  options: [string, string, string, string];
  explanation?: string;
};
