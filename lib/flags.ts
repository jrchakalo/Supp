/**
 * Rollout flags for the professor cockpit migration.
 *
 * Keeping these as build-time public flags lets us ship the v2 data model and
 * the new game stage incrementally, with a one-env rollback to the legacy path.
 */
export type ContentModel = 'legacy' | 'v2';

export const CONTENT_MODEL: ContentModel =
  process.env.NEXT_PUBLIC_CONTENT_MODEL === 'v2' ? 'v2' : 'legacy';

export const GAMES_V2 = process.env.NEXT_PUBLIC_GAMES_V2 !== '0';
