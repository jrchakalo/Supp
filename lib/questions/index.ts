import type { ClassicCategoryId } from '../types';
import type { ClassicLiveSeed, ClassicTfSeed } from './types';
import * as games from './classic-games';
import * as anime from './classic-anime';
import * as popCulture from './classic-pop-culture';
import * as tech from './classic-tech';
import * as digitalSafety from './classic-digital-safety';
import * as science from './classic-science';
import * as nature from './classic-nature';
import * as brazil from './classic-brazil';
import * as sports from './classic-sports';
import * as logic from './classic-logic';
import * as liveExtra from './classic-live-extra';
import * as animeTeen from './classic-anime-teen';
import * as animeLegacy from './classic-anime-legacy';

/** Order used by the topic pickers and by the combined deck. */
export const CLASSIC_THEME_ORDER: ClassicCategoryId[] = [
  'games',
  'anime',
  'pop-culture',
  'tech',
  'digital-safety',
  'science',
  'nature',
  'brazil',
  'sports',
  'logic',
];

const MODULES = [
  games,
  anime,
  popCulture,
  tech,
  digitalSafety,
  science,
  nature,
  brazil,
  sports,
  logic,
];

export const CLASSIC_TF_SEEDS: ClassicTfSeed[] = [
  ...MODULES.flatMap((module) => module.TF),
  ...animeTeen.TF,
  ...animeLegacy.TF,
];

export const CLASSIC_LIVE_SEEDS: ClassicLiveSeed[] = [
  ...MODULES.flatMap((module) => module.LIVE),
  ...liveExtra.LIVE,
  ...animeTeen.LIVE,
  ...animeLegacy.LIVE,
];
