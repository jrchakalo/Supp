import { CLASSIC_TF_SEEDS, CLASSIC_THEME_ORDER } from './questions';
import type {
  ClassicCategoryId,
  DifficultyId,
  Question,
  QuestionTier,
} from './types';

/**
 * Baralho original do modo clássico.
 *
 * Cada tema tem perguntas próprias de verdadeiro ou falso em três níveis
 * (fácil, médio e difícil), sempre em português com a versão em inglês no mapa
 * de tradução. A ordem dos arquivos de tema define os tiers usados pela
 * competição.
 */

const CATEGORY_LABELS: Record<
  ClassicCategoryId,
  { label: string; description: string }
> = {
  games: {
    label: 'Games',
    description: 'Minecraft, Roblox, Brawl Stars and other favorites.',
  },
  anime: {
    label: 'Anime',
    description: 'Dragon Ball, Naruto, One Piece and more.',
  },
  'pop-culture': {
    label: 'Pop culture',
    description: 'Movies, series, superheroes and family sagas.',
  },
  tech: {
    label: 'Technology',
    description: 'Computer parts, internet, Office tools, coding and AI.',
  },
  'digital-safety': {
    label: 'Digital safety',
    description: 'Passwords, scams, privacy and healthy screen habits.',
  },
  science: {
    label: 'Science & space',
    description: 'The body, planets, experiments and everyday science.',
  },
  nature: {
    label: 'Nature & animals',
    description: 'Habitats, fun animal facts and planet records.',
  },
  brazil: {
    label: 'Brazil & folklore',
    description: 'Regions, culture, food, music and Brazilian legends.',
  },
  sports: {
    label: 'Sports',
    description: 'Rules, records, Olympics and Brazilian athletes.',
  },
  logic: {
    label: 'Logic & puzzles',
    description: 'Sequences, riddles, patterns and math challenges.',
  },
};

export const CLASSIC_QUESTIONS: Question[] = (() => {
  const groups = new Map<string, Question[]>();

  for (const seed of CLASSIC_TF_SEEDS) {
    const question: Question = {
      id: seed.id,
      text: seed.pt,
      answer: seed.answer,
      explanation: seed.explanationPt,
      category: seed.category,
      difficulty: seed.difficulty,
    };

    const key = `${seed.category}:${seed.difficulty}`;
    const group = groups.get(key);
    if (group) group.push(question);
    else groups.set(key, [question]);
  }

  for (const group of groups.values()) {
    const tierSize = Math.ceil(group.length / 3);
    group.forEach((question, index) => {
      question.tier = Math.min(3, Math.floor(index / tierSize) + 1) as QuestionTier;
    });
  }

  return [...groups.values()].flat();
})();

export const CLASSIC_CATEGORIES: {
  id: ClassicCategoryId;
  label: string;
  description: string;
}[] = CLASSIC_THEME_ORDER.map((id) => ({
  id,
  ...CATEGORY_LABELS[id],
}));

export const CLASSIC_ALL_CATEGORIES: ClassicCategoryId[] = CLASSIC_CATEGORIES.map(
  (category) => category.id
);

/** The classic deck split into Easy, Medium and Hard, with tiers for competition. */
export const CLASSIC_DECKS: Record<DifficultyId, Question[]> = {
  easy: CLASSIC_QUESTIONS.filter((question) => question.difficulty === 'easy'),
  medium: CLASSIC_QUESTIONS.filter((question) => question.difficulty === 'medium'),
  hard: CLASSIC_QUESTIONS.filter((question) => question.difficulty === 'hard'),
};

/**
 * Returns the classic deck for a difficulty, optionally filtered by topics.
 * An empty selection falls back to every topic so a round never starts empty.
 */
export function getClassicDeck(
  difficulty: DifficultyId,
  categories: ClassicCategoryId[] = CLASSIC_ALL_CATEGORIES
): Question[] {
  const selected = new Set(
    categories.length > 0 ? categories : CLASSIC_ALL_CATEGORIES
  );

  return CLASSIC_DECKS[difficulty].filter(
    (question) => question.category && selected.has(question.category)
  );
}

const DIFFICULTY_ORDER: DifficultyId[] = ['easy', 'medium', 'hard'];

/**
 * Deck used by D20 rounds.
 *
 * A single topic has 8 questions per difficulty, which is fewer than the 20
 * rolls of a full round. When the chosen topic is too narrow, this widens to
 * the other difficulties of the same topic so a 20-round game does not repeat
 * a question before the round ends.
 */
export function getClassicRunDeck(
  difficulty: DifficultyId,
  categories: ClassicCategoryId[] = CLASSIC_ALL_CATEGORIES,
  minimum = 20
): Question[] {
  const primary = getClassicDeck(difficulty, categories);
  if (primary.length >= minimum) return primary;

  const byId = new Map(primary.map((question) => [question.id, question]));
  const ordered = [
    difficulty,
    ...DIFFICULTY_ORDER.filter((item) => item !== difficulty),
  ];

  for (const level of ordered) {
    if (byId.size >= minimum) break;
    for (const question of getClassicDeck(level, categories)) {
      byId.set(question.id, question);
    }
  }

  return [...byId.values()];
}
