import type { ClassicCategoryId, DifficultyId, ModeId, Theme } from '../types';
import type { Language } from '../i18n/types';

/**
 * Message protocol between the host device (teacher) and player devices for
 * the Halloween Live room mode, transported by a Supabase Realtime channel.
 *
 * The host is the single authority: it picks the run of questions, keeps the
 * timers, computes the scores and pushes every game event. Players only send
 * their answers and everything else they receive.
 */

/** Channel namespace. The room code is appended: `supp-live:AB3D9K`. */
export const CHANNEL_PREFIX = 'supp-live';

/** Player cap per room. Supabase Realtime handles presence up to 100–200 clients. */
export const MAX_PLAYERS = 60;

export type LiveGameConfig = {
  mode: ModeId;
  language: Language;
  theme: Theme;
  difficulty: DifficultyId;
  questionCount: 8 | 12 | 16;
  secondsPerQuestion: 15 | 20 | 30;
  /** When true, player devices show the question and answer texts. */
  showQuestionOnPlayer: boolean;
  /**
   * When true, questions that carry a Portuguese translation reveal it halfway
   * through the timer, on the projector and on the player devices.
   */
  translateAtHalf?: boolean;
  /** Classic topics. Ignored by Halloween rooms. */
  categories?: ClassicCategoryId[];
};

export type LivePlayerRef = {
  id: string;
  name: string;
};

export type LiveScoreRow = {
  playerId: string;
  name: string;
  total: number;
  streak: number;
  /** Points earned on the latest revealed question. */
  gained: number;
  correct: boolean;
};

/** Host → players: config snapshot for late joiners. */
export type LobbyMessage = {
  kind: 'lobby';
  code: string;
  config: LiveGameConfig;
};

/** Host → players: a question is live right now. */
export type QuestionStartMessage = {
  kind: 'question';
  seq: number;
  /** How many questions the run has, so the TV can show "1 de 12". */
  total?: number;
  questionId: string;
  text: string;
  options: string[];
  timeoutMs: number;
  startedAt: number;
  /** Portuguese translation of `text`, aligned with the shuffled `options`. */
  textPt?: string;
  optionsPt?: string[];
  /** Milliseconds after `startedAt` at which the translation must appear. */
  translateAtMs?: number;
};

/** Host → players: question is over, show the reveal. */
export type RevealMessage = {
  kind: 'reveal';
  seq: number;
  total?: number;
  questionId: string;
  text: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  counts: number[];
  leaderboard: LiveScoreRow[];
};

/** Host → players: the run is over. */
export type GameOverMessage = {
  kind: 'gameover';
  leaderboard: LiveScoreRow[];
};

/** Host → players: the host closed the room. */
export type RoomClosedMessage = {
  kind: 'roomclosed';
};

export type HostToPlayerMessage =
  | LobbyMessage
  | QuestionStartMessage
  | RevealMessage
  | GameOverMessage
  | RoomClosedMessage;

/** Player → host: one locked answer. */
export type AnswerMessage = {
  kind: 'answer';
  playerId: string;
  name: string;
  seq: number;
  optionIndex: number;
};

export type PlayerToHostMessage = AnswerMessage;

export function channelNameFor(code: string): string {
  return `${CHANNEL_PREFIX}:${code}`;
}
