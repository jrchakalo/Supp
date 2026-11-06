export type ModeId = 'classic' | 'halloween';

export type Theme = 'light' | 'dark';

export type DifficultyId = 'easy' | 'medium' | 'hard';

/** Topics available in the classic deck. */
export type ClassicCategoryId = 'games' | 'anime' | 'pop-culture' | 'animals' | 'tech';

/** 1 = gentlest questions in a deck, 3 = hardest questions in that deck. */
export type QuestionTier = 1 | 2 | 3;

export type Question = {
  id: string;
  text: string;
  answer: boolean;
  /** Optional placement inside the difficulty deck. Used by competition mode. */
  tier?: QuestionTier;
  /** Deck difficulty. Populated for the classic deck. */
  difficulty?: DifficultyId;
  /** Classic topic. Populated for the classic deck. */
  category?: ClassicCategoryId;
  /** Short, kid-friendly fact shown after the player answers. */
  explanation?: string;
};

export type LiveOptionIndex = 0 | 1 | 2 | 3;

/**
 * Multiple-choice question used by the Halloween Live room mode.
 * Four options, exactly one of them correct. The canonical `correctIndex`
 * is shuffled at runtime so every game shows options in a fresh order.
 */
export type LiveQuestion = {
  id: string;
  /** 1 = gentlest questions in the difficulty, 3 = the hardest ones. */
  tier: QuestionTier;
  /** Deck difficulty. Present on the classic live deck; Halloween infers it from the deck. */
  difficulty?: DifficultyId;
  /** Classic topic. Present on the classic live deck. */
  category?: ClassicCategoryId;
  text: string;
  options: [string, string, string, string];
  correctIndex: LiveOptionIndex;
  /** Short, kid-friendly fact shown on the reveal screen. */
  explanation: string;
};

export type AnswerStatus = 'correct' | 'incorrect' | null;

export type DifficultyMeta = {
  id: DifficultyId;
  label: string;
  tagline: string;
  description: string;
  /** Short hint shown in the game header. */
  audience: string;
};

export type CompetitionLevelId = 'easy' | 'medium' | 'hard' | 'progressive';

export type ProgressiveRounds = 2 | 3;

export type StudentOrder = 'sequential' | 'random';

export type Student = {
  id: string;
  name: string;
};

export type CompetitionConfig = {
  level: CompetitionLevelId;
  progressiveRounds: ProgressiveRounds;
  order: StudentOrder;
};

export type CompetitionPhase = {
  id: string;
  /** 0-based position in the competition. */
  index: number;
  difficulty: DifficultyId;
  tier: QuestionTier;
  /** Example: "Medium · Starter". */
  label: string;
  /** Example: "Medium starter". */
  shortLabel: string;
};

export type CompetitionLevelMeta = {
  id: CompetitionLevelId;
  label: string;
  tagline: string;
  description: string;
  /** Example: "5 phases" or "6 or 9 phases". */
  phasesLabel: string;
};

export type PhaseResult = {
  studentId: string;
  studentName: string;
  questionId: string;
  correct: boolean;
};
