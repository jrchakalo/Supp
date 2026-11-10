import { OVERRIDES_1, type TfOverride } from './tf-overrides-1';
import { OVERRIDES_2 } from './tf-overrides-2';
import { OVERRIDES_3 } from './tf-overrides-3';

/**
 * Curated true → false replacements used to keep every category and
 * difficulty near a 50/50 split. The original statement is replaced by a
 * false version of the same fact, so no topic or series is lost.
 */
export const TF_OVERRIDES: Record<string, TfOverride> = {
  ...OVERRIDES_1,
  ...OVERRIDES_2,
  ...OVERRIDES_3,
};
