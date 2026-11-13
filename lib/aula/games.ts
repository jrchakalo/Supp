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
