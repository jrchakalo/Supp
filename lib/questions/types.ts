import type { ClassicCategoryId, DifficultyId } from '../types';

/**
 * Compact row used to build the classic true-or-false deck.
 *
 * Both languages live side by side so the deck never drifts out of sync:
 * `pt` is the canonical text shown by default and `en` is used by the English
 * translation map.
 */
export type ClassicTfSeed = {
  id: string;
  category: ClassicCategoryId;
  difficulty: DifficultyId;
  pt: string;
  en: string;
  answer: boolean;
  explanationPt: string;
  explanationEn: string;
};

/**
 * Compact row used to build the classic Live (multiple-choice) deck.
 * `optionsEn` follows the canonical English order and `correctIndex` points
 * into it; `optionsPt` must follow the same order.
 */
export type ClassicLiveSeed = {
  id: string;
  category: ClassicCategoryId;
  difficulty: DifficultyId;
  en: string;
  pt: string;
  optionsEn: [string, string, string, string];
  optionsPt: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanationEn: string;
  explanationPt: string;
};
