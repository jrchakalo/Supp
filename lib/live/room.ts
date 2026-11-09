import { shuffle } from '../game';
import type { ClassicCategoryId, DifficultyId, LiveOptionIndex, LiveQuestion, ModeId } from '../types';
import { LIVE_QUESTIONS } from '../live-questions';
import { CLASSIC_LIVE_QUESTIONS } from '../classic-live-questions';
import type { LiveScoreRow } from './protocol';

/**
 * Pure helpers for the Halloween Live room mode: room codes, question runs,
 * option shuffling and the speed-based score.
 */

/** Unambiguous alphabet (no I, O, 0, 1, L). */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Households type three letters/digits on a phone keyboard. 5 is game-show-like. */
export const CODE_LENGTH = 5;

export function randomRoomCode(): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Accepts only alphanumerics, uppercase, 3–6 chars. Returns null otherwise. */
export function sanitizeRoomCode(raw: string): string | null {
  const code = raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  return code.length >= 3 && code.length <= 6 ? code : null;
}

export function randomId(prefix: string): string {
  const unique =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID().slice(0, 8)
      : Math.random().toString(36).slice(2, 10);
  return `${prefix}-${unique}`;
}

export function getLiveDeck(
  mode: ModeId,
  difficulty: DifficultyId,
  categories?: ClassicCategoryId[]
): LiveQuestion[] {
  if (mode === 'classic') {
    const deck = CLASSIC_LIVE_QUESTIONS.filter(
      (question) => question.difficulty === difficulty
    );
    const selected = new Set(categories ?? []);

    return selected.size > 0
      ? deck.filter((question) => question.category && selected.has(question.category))
      : deck;
  }

  return LIVE_QUESTIONS[difficulty] ?? LIVE_QUESTIONS.easy;
}

/**
 * Builds a run of questions spread across the three tiers (1 → 2 → 3,
 * cycling) so a 8/12/16-question run always mixes all tiers.
 */
export function buildQuestionRun(
  mode: ModeId,
  difficulty: DifficultyId,
  count: number,
  categories?: ClassicCategoryId[]
): LiveQuestion[] {
  const deck = getLiveDeck(mode, difficulty, categories);
  const tiers = () => [1, 2, 3].map((tier) => shuffle(deck.filter((q) => q.tier === tier)));
  let byTier = tiers();
  const run: LiveQuestion[] = [];
  let tierPos = 0;
  let emptyStreak = 0;

  while (run.length < count) {
    const bucket = byTier[tierPos % 3];
    const next = bucket.shift();

    if (next) {
      run.push(next);
      emptyStreak = 0;
    } else {
      emptyStreak += 1;

      // A topic filter can empty a whole tier. Once all three are empty,
      // reshuffle the filtered deck and keep cycling until the run is full.
      if (emptyStreak >= 3) {
        if (deck.length === 0) break;
        byTier = tiers();
        emptyStreak = 0;
        if (byTier.every((tier) => tier.length === 0)) break;
      }
    }

    tierPos += 1;
  }

  return run;
}

export type PreparedLiveQuestion = {
  id: string;
  text: string;
  /** Options already shuffled — ordered exactly as displayed to everyone. */
  options: string[];
  /** Index of the correct option among the shuffled `options`. */
  correctIndex: number;
  /** Portuguese translation, when the deck provides one. */
  textPt?: string;
  /** Portuguese options reordered to match the shuffled `options`. */
  optionsPt?: string[];
};

/** Shuffles the four options so the correct answer is never the same slot. */
export function prepareQuestion(question: LiveQuestion): PreparedLiveQuestion {
  // Shuffle indexes (not just values) so the translation keeps the same
  // alignment as the displayed options.
  const order = shuffle([0, 1, 2, 3] as const);
  const options = order.map((index) => question.options[index]);
  const sourcePt = question.optionsPt;
  const optionsPt = sourcePt ? order.map((index) => sourcePt[index]) : undefined;

  return {
    id: question.id,
    text: question.text,
    options,
    correctIndex: order.indexOf(question.correctIndex) as LiveOptionIndex,
    textPt: question.textPt,
    optionsPt,
  };
}

/** Fast fingers earn more points: 1000 at once down to 100 at the buzzer. */
export function scoreForAnswer(elapsedMs: number, timeoutMs: number): number {
  const ratio = Math.min(Math.max(elapsedMs / timeoutMs, 0), 1);
  const points = 1000 - Math.floor(ratio * 900);
  return Math.max(points, 100);
}

export function formatPoints(points: number): string {
  return `+${points.toLocaleString('pt-BR')}`;
}

/** Sorts the leaderboard like a game-show board: score first, name second. */
export function sortLeaderboard(rows: LiveScoreRow[]): LiveScoreRow[] {
  return [...rows].sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}

/**
 * Answer choices shown to the players: shape + color, matching the projector,
 * so reading the screen correlates 1:1 with the phone buttons.
 */
export const ANSWER_BUTTONS = [
  { shape: '▲', bg: '#e21b3c' },
  { shape: '◆', bg: '#1368ce' },
  { shape: '●', bg: '#d89e00' },
  { shape: '■', bg: '#26890c' },
] as const;
