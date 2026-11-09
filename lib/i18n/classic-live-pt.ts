import { CLASSIC_LIVE_SEEDS } from '../questions';
import type { LiveQuestionTranslation } from './types';

/**
 * Brazilian Portuguese translations for the Classic Live deck.
 * Generated from the same bilingual seed file as the English deck, so the
 * option order always matches `correctIndex`.
 */
export const CLASSIC_LIVE_PT: Record<string, LiveQuestionTranslation> =
  Object.fromEntries(
    CLASSIC_LIVE_SEEDS.map((seed) => [
      seed.id,
      {
        text: seed.pt,
        options: seed.optionsPt,
        explanation: seed.explanationPt,
      },
    ])
  );
