import { getDeck, shuffle } from './game';
import type {
  ClassicCategoryId,
  CompetitionLevelId,
  CompetitionLevelMeta,
  CompetitionPhase,
  DifficultyId,
  ModeId,
  ProgressiveRounds,
  Question,
  QuestionTier,
  Student,
  StudentOrder,
} from './types';

const DIFFICULTY_ORDER: DifficultyId[] = ['easy', 'medium', 'hard'];

const TIER_LABELS: Record<QuestionTier, string> = {
  1: 'Starter',
  2: 'Core',
  3: 'Challenge',
};

const DIFFICULTY_LABELS: Record<DifficultyId, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

const HARD_PHASES: Array<{ tier: QuestionTier; label: string; shortLabel: string }> = [
  { tier: 1, label: 'Starter', shortLabel: 'Hard starter' },
  { tier: 2, label: 'Core', shortLabel: 'Hard core' },
  { tier: 3, label: 'Challenge', shortLabel: 'Hard challenge' },
  { tier: 3, label: 'Expert', shortLabel: 'Hard expert' },
  { tier: 3, label: 'Final', shortLabel: 'Hard final' },
  { tier: 3, label: 'Championship', shortLabel: 'Hard championship' },
];

export const COMPETITION_LEVELS: CompetitionLevelMeta[] = [
  {
    id: 'easy',
    label: 'Easy',
    tagline: 'Gentle start',
    description: 'Three easy rounds, then three medium rounds.',
    phasesLabel: '6 phases',
  },
  {
    id: 'medium',
    label: 'Medium',
    tagline: 'Balanced climb',
    description: 'Three medium rounds, then three hard rounds.',
    phasesLabel: '6 phases',
  },
  {
    id: 'hard',
    label: 'Hard',
    tagline: 'No mercy',
    description: 'Six hard rounds, from starter to championship.',
    phasesLabel: '6 phases',
  },
  {
    id: 'progressive',
    label: 'Progressive',
    tagline: 'Full journey',
    description: 'Two or three rounds at every difficulty. The ultimate marathon.',
    phasesLabel: '6 or 9 phases',
  },
];

function makePhase(
  difficulty: DifficultyId,
  tier: QuestionTier,
  label: string,
  shortLabel: string,
  index = 0
): CompetitionPhase {
  return {
    id: `${difficulty}-${tier}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
    index,
    difficulty,
    tier,
    label,
    shortLabel,
  };
}

function withIndexes(phases: CompetitionPhase[]): CompetitionPhase[] {
  return phases.map((phase, index) => ({
    ...phase,
    index,
    id: `${phase.id}-${index}`,
  }));
}

function standardPhase(difficulty: DifficultyId, tier: QuestionTier): CompetitionPhase {
  return makePhase(
    difficulty,
    tier,
    `${DIFFICULTY_LABELS[difficulty]} · ${TIER_LABELS[tier]}`,
    `${DIFFICULTY_LABELS[difficulty]} ${TIER_LABELS[tier].toLowerCase()}`
  );
}

/**
 * Builds the phase ladder for a competition.
 *
 * Easy:        easy 1 → easy 2 → easy 3 → medium 1 → medium 2 → medium 3
 * Medium:      medium 1 → medium 2 → medium 3 → hard 1 → hard 2 → hard 3
 * Hard:        six hard rounds, from starter to championship
 * Progressive: 2 or 3 rounds in each difficulty (easy → medium → hard)
 */
export function buildCompetitionPhases(
  level: CompetitionLevelId,
  progressiveRounds: ProgressiveRounds
): CompetitionPhase[] {
  let phases: CompetitionPhase[];

  switch (level) {
    case 'easy':
      phases = [
        standardPhase('easy', 1),
        standardPhase('easy', 2),
        standardPhase('easy', 3),
        standardPhase('medium', 1),
        standardPhase('medium', 2),
        standardPhase('medium', 3),
      ];
      break;
    case 'medium':
      phases = [
        standardPhase('medium', 1),
        standardPhase('medium', 2),
        standardPhase('medium', 3),
        standardPhase('hard', 1),
        standardPhase('hard', 2),
        standardPhase('hard', 3),
      ];
      break;
    case 'hard':
      phases = HARD_PHASES.map(({ tier, label, shortLabel }) =>
        makePhase('hard', tier, `Hard · ${label}`, shortLabel)
      );
      break;
    case 'progressive':
      phases = DIFFICULTY_ORDER.flatMap((difficulty) =>
        Array.from({ length: progressiveRounds }, (_, roundIndex) => {
          const tier = (roundIndex + 1) as QuestionTier;
          const round = roundIndex + 1;
          return makePhase(
            difficulty,
            tier,
            `${DIFFICULTY_LABELS[difficulty]} · Round ${round}/${progressiveRounds}`,
            `${DIFFICULTY_LABELS[difficulty]} ${round}/${progressiveRounds}`
          );
        })
      );
      break;
  }

  return withIndexes(phases);
}

/**
 * Builds a sudden-death round for the students still tied after the final
 * regular phase. The tiebreaker uses the final phase's difficulty and tier.
 */
export function buildTiebreakPhase(
  finalPhase: CompetitionPhase,
  round: number
): CompetitionPhase {
  return makePhase(
    finalPhase.difficulty,
    finalPhase.tier,
    `Tiebreaker · Round ${round}`,
    `Tiebreak ${round}`,
    finalPhase.index
  );
}

export function getCompetitionLevelMeta(level: CompetitionLevelId): CompetitionLevelMeta {
  return (
    COMPETITION_LEVELS.find((item) => item.id === level) ?? COMPETITION_LEVELS[0]
  );
}

export function getPhaseCount(
  level: CompetitionLevelId,
  progressiveRounds: ProgressiveRounds
): number {
  return buildCompetitionPhases(level, progressiveRounds).length;
}

/** Fisher–Yates order for the students in one phase. */
export function orderStudents(students: Student[], order: StudentOrder): Student[] {
  return order === 'random' ? shuffle(students) : [...students];
}

export function normalizeStudentName(name: string): string {
  return name.replace(/\s+/g, ' ').trim();
}

export function createStudent(name: string): Student {
  const normalized = normalizeStudentName(name);
  const randomPart =
    typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return {
    id: `student-${randomPart}`,
    name: normalized,
  };
}

/** Removes duplicates and blank names from a pasted list. */
export function parseStudentNames(input: string): string[] {
  return input
    .split(/[\n,;]+/)
    .map(normalizeStudentName)
    .filter(Boolean);
}

export type PhaseQuestion = {
  studentId: string;
  question: Question;
};

function uniqueQuestions(questions: Question[]): Question[] {
  const seen = new Set<string>();
  return questions.filter((question) => {
    if (seen.has(question.id)) return false;
    seen.add(question.id);
    return true;
  });
}

function unusedQuestions(questions: Question[], usedIds: ReadonlySet<string>): Question[] {
  return shuffle(questions.filter((question) => !usedIds.has(question.id)));
}

/**
 * Draws one question per student for a phase.
 *
 * The primary tier is used first. If a large class needs more questions than a
 * tier has, the draw expands to the rest of the same difficulty and finally to
 * the other difficulties. Already-used questions are only reused when the whole
 * deck has been exhausted.
 *
 * The passed `usedIds` set is updated with every question that is assigned.
 */
export type PhaseDeckOptions = {
  mode: ModeId;
  /** Classic topics. Ignored by the Halloween deck. */
  categories?: ClassicCategoryId[];
};

function deckForPhase(
  difficulty: DifficultyId,
  options: PhaseDeckOptions
): Question[] {
  if (options.mode !== 'classic') {
    return getDeck('halloween', difficulty);
  }

  const deck = getDeck('classic', difficulty);
  const selected = new Set(options.categories ?? []);
  if (selected.size === 0) return deck;

  return deck.filter(
    (question) => question.category && selected.has(question.category)
  );
}

export function drawPhaseQuestions(
  phase: CompetitionPhase,
  students: Student[],
  usedIds: Set<string>,
  options: PhaseDeckOptions = { mode: 'halloween' }
): PhaseQuestion[] {
  if (students.length === 0) return [];

  const primary = deckForPhase(phase.difficulty, options).filter(
    (question) => (question.tier ?? 2) === phase.tier
  );
  const sameDifficulty = deckForPhase(phase.difficulty, options).filter(
    (question) => (question.tier ?? 2) !== phase.tier
  );
  const otherDifficulties = DIFFICULTY_ORDER.filter(
    (difficulty) => difficulty !== phase.difficulty
  ).flatMap((difficulty) => deckForPhase(difficulty, options));

  const freshPool = uniqueQuestions([
    ...unusedQuestions(primary, usedIds),
    ...unusedQuestions(sameDifficulty, usedIds),
    ...unusedQuestions(otherDifficulties, usedIds),
  ]);

  const usedFallback = shuffle(uniqueQuestions([...primary, ...sameDifficulty, ...otherDifficulties]));

  const pool = uniqueQuestions([...freshPool, ...usedFallback]);

  return students.map((student, index) => {
    const question = pool[index % pool.length];
    usedIds.add(question.id);
    return { studentId: student.id, question };
  });
}
