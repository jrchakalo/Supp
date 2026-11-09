import { readStorage, removeStorage, writeStorage } from '../storage';
import type { ModeId } from '../types';

/**
 * Cross-room memory for Live questions.
 *
 * A room is short (8/12/16 questions) and teachers often open several rooms in
 * one day. Remembering the questions already shown makes the random draw feel
 * fresh instead of looping back to the same items. The history is capped so it
 * never grows without bound and rotates once a full deck has been seen.
 */

const STORAGE_NAME = 'live-recent-questions';
/** Enough to cover the useful part of a deck without bloating localStorage. */
const MAX_IDS_PER_MODE = 360;

type HistoryStore = Partial<Record<ModeId, string[]>>;

function readStore(): HistoryStore {
  try {
    const raw = readStorage(STORAGE_NAME);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return parsed as HistoryStore;
  } catch {
    return {};
  }
}

function writeStore(store: HistoryStore): void {
  try {
    writeStorage(STORAGE_NAME, JSON.stringify(store));
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
}

export function readRecentLiveIds(mode: ModeId): Set<string> {
  const ids = readStore()[mode];
  return new Set(Array.isArray(ids) ? ids : []);
}

/**
 * Prepends the latest run and trims the history. The most recent questions
 * stay at the front so the oldest ones rotate back in first.
 */
export function rememberLiveRun(mode: ModeId, ids: string[]): void {
  if (ids.length === 0) return;

  const store = readStore();
  const previous = Array.isArray(store[mode]) ? store[mode]! : [];
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const id of [...ids, ...previous]) {
    if (seen.has(id)) continue;
    seen.add(id);
    merged.push(id);
    if (merged.length >= MAX_IDS_PER_MODE) break;
  }

  store[mode] = merged;
  writeStore(store);
}

export function clearLiveHistory(mode?: ModeId): void {
  if (!mode) {
    removeStorage(STORAGE_NAME);
    return;
  }

  const store = readStore();
  delete store[mode];
  writeStore(store);
}
