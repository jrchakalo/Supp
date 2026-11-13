import type { ClassicCategoryId } from '@/lib/types';

export type WheelQuestion = {
  id: string;
  text: string;
  answer: boolean;
  explanation?: string;
};

export type WheelGameState = {
  seq: number;
  phase: 'idle' | 'spinning' | 'question' | 'revealed' | 'over';
  categories: ClassicCategoryId[];
  rotation: number;
  picked: ClassicCategoryId | null;
  round: number;
  rounds: number | null;
  score: { correct: number; total: number };
  question: WheelQuestion | null;
  revealed: boolean;
  lastAnswerCorrect: boolean | null;
  spinId: number;
};

export type WheelGameMessage = {
  type: 'game';
  game: 'wheel';
  seq: number;
  state: WheelGameState;
};

export type WheelCommandMessage = {
  type: 'command';
  game: 'wheel';
  action: 'spin';
  nonce: number;
};

export type WheelEndMessage = {
  type: 'gameEnd';
};

export type PassaQuestion = {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation?: string;
  category?: ClassicCategoryId;
};

export type PassaGameState = {
  seq: number;
  phase: 'question' | 'steal' | 'reveal' | 'over';
  teams: [string, string];
  scores: [number, number];
  activeTeam: 0 | 1;
  starter: 0 | 1;
  target: number;
  round: number;
  question: PassaQuestion | null;
  chosenIndex: number | null;
  revealed: boolean;
  lastResult: { team: 0 | 1 | null; stolen: boolean; correct: boolean } | null;
  deadline: number | null;
  winner: 0 | 1 | null;
};

export type PassaGameMessage = {
  type: 'game';
  game: 'passa';
  seq: number;
  state: PassaGameState;
};
