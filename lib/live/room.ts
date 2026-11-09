import { shuffle } from '../game';
import type { ClassicCategoryId, DifficultyId, LiveOptionIndex, LiveQuestion, ModeId } from '../types';
import { LIVE_QUESTIONS } from '../live-questions';
import { CLASSIC_LIVE_QUESTIONS } from '../classic-live-questions';
import type { LiveScoreRow } from './protocol';

/**
 * Pure helpers for the Live room mode: room codes, question runs, option
 * shuffling and the speed-based score.
 */

/** Unambiguous alphabet (no I, O, 0, 1, L). */
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
/** Households type three letters/digits on a phone keyboard. 5 is game-show-like. */
export const CODE_LENGTH = 5;

const DIFFICULTY_ORDER: DifficultyId[] = ['easy', 'medium', 'hard'];

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

/** Full classic pool for the selected topics, across every difficulty. */
function classicPool(categories?: ClassicCategoryId[]): LiveQuestion[] {
  const selected = new Set(categories ?? []);
  return selected.size > 0
    ? CLASSIC_LIVE_QUESTIONS.filter(
        (question) => question.category && selected.has(question.category)
      )
    : CLASSIC_LIVE_QUESTIONS;
}

export function getLiveDeck(
  mode: ModeId,
  difficulty: DifficultyId,
  categories?: ClassicCategoryId[]
): LiveQuestion[] {
  if (mode === 'classic') {
    return classicPool(categories).filter(
      (question) => question.difficulty === difficulty
    );
  }

  return LIVE_QUESTIONS[difficulty] ?? LIVE_QUESTIONS.easy;
}

/**
 * Total questions available for a run. For the classic deck the host can
 * widen to the other difficulties when a single topic does not have enough
 * questions for the selected round length.
 */
export function getLiveCapacity(
  mode: ModeId,
  difficulty: DifficultyId,
  categories?: ClassicCategoryId[]
): number {
  if (mode !== 'classic') {
    return getLiveDeck(mode, difficulty, categories).length;
  }

  const ids = new Set(
    getLiveDeck(mode, difficulty, categories).map((question) => question.id)
  );
  const ordered = [
    difficulty,
    ...DIFFICULTY_ORDER.filter((item) => item !== difficulty),
  ];

  for (const level of ordered) {
    if (ids.size >= 48) break;
    for (const question of getLiveDeck(mode, level, categories)) {
      ids.add(question.id);
    }
  }

  return ids.size;
}

/**
 * Builds the pool for a run.
 *
 * Classic rooms start with the chosen difficulty and only widen to the other
 * difficulties when a single topic would otherwise run out. This keeps the
 * difficulty meaningful for multi-topic rooms while still allowing a 16-question
 * run on a niche theme without repeating a question.
 */
function buildPool(
  mode: ModeId,
  difficulty: DifficultyId,
  categories?: ClassicCategoryId[]
): LiveQuestion[] {
  if (mode !== 'classic') {
    return getLiveDeck(mode, difficulty, categories);
  }

  const byId = new Map<string, LiveQuestion>();
  const add = (questions: LiveQuestion[]) => {
    for (const question of questions) byId.set(question.id, question);
  };

  add(getLiveDeck(mode, difficulty, categories));

  const selected = new Set(categories ?? []);
  const ordered = [
    difficulty,
    ...DIFFICULTY_ORDER.filter((item) => item !== difficulty),
  ];

  for (const level of ordered) {
    if (byId.size >= 48) break;
    add(
      classicPool(categories).filter(
        (question) =>
          question.difficulty === level &&
          (!selected.size || (question.category && selected.has(question.category)))
      )
    );
  }

  return [...byId.values()];
}

/**
 * Builds a run of questions spread across the three tiers (1 → 2 → 3,
 * cycling) so an 8/12/16-question run always mixes all tiers.
 *
 * `recentIds` is the cross-room history: unseen questions are drawn first and
 * already-used ones only fill the gaps after the whole pool has been seen.
 * A question never appears twice in the same run.
 */
export function buildQuestionRun(
  mode: ModeId,
  difficulty: DifficultyId,
  count: number,
  categories?: ClassicCategoryId[],
  recentIds?: ReadonlySet<string>
): LiveQuestion[] {
  const pool = buildPool(mode, difficulty, categories);
  const used = new Set<string>();
  const recent = recentIds ?? new Set<string>();

  const makeBuckets = () =>
    [1, 2, 3].map((tier) => {
      const bucket = shuffle(pool.filter((question) => question.tier === tier));
      return {
        unseen: bucket.filter((question) => !recent.has(question.id)),
        seen: bucket.filter((question) => recent.has(question.id)),
      };
    });

  const buckets = makeBuckets();
  const run: LiveQuestion[] = [];
  let tierPos = 0;
  let emptyStreak = 0;

  const takeNext = () => {
    const start = tierPos % 3;
    const order = [start, (start + 1) % 3, (start + 2) % 3];

    // Prefer unseen questions in every tier before reusing any question that
    // already appeared in a recent room.
    for (const index of order) {
      const next = buckets[index].unseen.shift();
      if (!next) continue;
      if (used.has(next.id)) continue;
      used.add(next.id);
      run.push(next);
      return true;
    }

    for (const index of order) {
      const next = buckets[index].seen.shift();
      if (!next) continue;
      if (used.has(next.id)) continue;
      used.add(next.id);
      run.push(next);
      return true;
    }

    return false;
  };

  while (run.length < count) {
    if (takeNext()) {
      emptyStreak = 0;
    } else {
      emptyStreak += 1;

      // Once every tier is empty there is nothing left to add. Returning a
      // shorter run is better than repeating a question in the same game.
      if (emptyStreak >= 3) break;
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
