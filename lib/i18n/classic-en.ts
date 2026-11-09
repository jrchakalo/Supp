import { CLASSIC_TF_SEEDS } from '../questions';
import type { QuestionTranslation } from './types';

/**
 * English version of the classic true-or-false deck.
 * Generated from the same bilingual seed file used by the Portuguese deck,
 * so the two languages can never drift apart.
 */
export const CLASSIC_EN: Record<string, QuestionTranslation> = Object.fromEntries(
  CLASSIC_TF_SEEDS.map((seed) => [
    seed.id,
    { text: seed.en, explanation: seed.explanationEn },
  ])
);
