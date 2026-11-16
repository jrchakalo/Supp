import { readStorage, removeStorage, writeStorage } from '../storage';
import type { ModeId } from '../types';

/**
 * Cross-run memory for quiz questions.
 *
 * Every game (Live, D20, wheel, Passa Repassa, competition) records the
 * questions it showed here. The next draw prefers questions that were not used
 * yet, so several classes on the same day get different questions even though
 * the browser is the same. Once the pool is exhausted the oldest ids rotate
 * back in — a shorter run is never repeated inside the same game.
 */

export type QuestionScope =
  | 'classic-tf'
  | 'classic-live'
  | 'halloween-tf'
  | 'halloween-live';

const STORAGE_NAME = 'question-history';
const LEGACY_STORAGE_NAME = 'live-recent-questions';
/** Covers the whole bank (552 true/false + 344 multiple choice) with margin. */
const MAX_IDS_PER_SCOPE = 1200;

type HistoryStore = Partial<Record<QuestionScope, string[]>>;

function parseStore(raw: string | null): HistoryStore {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as HistoryStore;
  } catch {
    return {};
  }
}

function migrateLegacy(store: HistoryStore): HistoryStore {
  const legacy = parseStore(readStorage(LEGACY_STORAGE_NAME)) as Record<string, unknown>;
  if (!Object.keys(legacy).length) return store;

  const migrated: HistoryStore = { ...store };
  const classic = legacy.classic;
  const halloween = legacy.halloween;
  if (Array.isArray(classic) && classic.length && !migrated['classic-live']) {
    migrated['classic-live'] = classic.filter((id): id is string => typeof id === 'string');
  }
  if (Array.isArray(halloween) && halloween.length && !migrated['halloween-live']) {
    migrated['halloween-live'] = halloween.filter(
      (id): id is string => typeof id === 'string'
    );
  }
  removeStorage(LEGACY_STORAGE_NAME);
  writeStore(migrated);
  return migrated;
}

function readStore(): HistoryStore {
  const store = migrateLegacy(parseStore(readStorage(STORAGE_NAME)));
  return store;
}

function writeStore(store: HistoryStore): void {
  try {
    writeStorage(STORAGE_NAME, JSON.stringify(store));
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
}

export function readRecentIds(scope: QuestionScope): Set<string> {
  const ids = readStore()[scope];
  return new Set(Array.isArray(ids) ? ids : []);
}

/**
 * Prepends the latest ids and trims the history. The most recent items stay at
 * the front so the oldest ones rotate back in first.
 */
export function rememberIds(scope: QuestionScope, ids: string[]): void {
  if (ids.length === 0) return;

  const store = readStore();
  const previous = Array.isArray(store[scope]) ? store[scope]! : [];
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const id of [...ids, ...previous]) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
    if (merged.length >= MAX_IDS_PER_SCOPE) break;
  }

  store[scope] = merged;
  writeStore(store);
}

export function clearQuestionHistory(scope?: QuestionScope): void {
  if (!scope) {
    removeStorage(STORAGE_NAME);
    return;
  }
  const store = readStore();
  delete store[scope];
  writeStore(store);
}

/* ------------------------------------------------------------------ */
/* Live compatibility (room history uses the multiple-choice pools)    */
/* ------------------------------------------------------------------ */

function liveScope(mode: ModeId): QuestionScope {
  return mode === 'classic' ? 'classic-live' : 'halloween-live';
}

export function readRecentLiveIds(mode: ModeId): Set<string> {
  return readRecentIds(liveScope(mode));
}

export function rememberLiveRun(mode: ModeId, ids: string[]): void {
  rememberIds(liveScope(mode), ids);
}

export function clearLiveHistory(mode?: ModeId): void {
  if (!mode) {
    clearQuestionHistory('classic-live');
    clearQuestionHistory('halloween-live');
    return;
  }
  clearQuestionHistory(liveScope(mode));
}
