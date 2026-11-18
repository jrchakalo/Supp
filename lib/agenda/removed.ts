/**
 * Soft-delete marker for occurrences.
 *
 * A removed occurrence keeps its row (class report, snapshot and audit trail)
 * but gains `notes.removed` and disappears from the agenda, lesson list and
 * history. The marker lives in `notes` because it is server-only: the browser
 * never receives notes; it asks `/api/occurrences/removed` for the hidden ids.
 */

export type RemovedMark = {
  at: string;
  reason?: string;
};

function parseNotes(notes: string | null | undefined): Record<string, unknown> | null {
  if (!notes) return null;
  try {
    const parsed = JSON.parse(notes) as unknown;
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function readRemovedMark(notes: string | null | undefined): RemovedMark | null {
  const parsed = parseNotes(notes);
  const removed = parsed?.removed;
  if (!removed || typeof removed !== 'object') return null;

  const at = (removed as { at?: unknown }).at;
  if (typeof at !== 'string') return null;

  const reason = (removed as { reason?: unknown }).reason;
  return { at, reason: typeof reason === 'string' ? reason : undefined };
}

export function isRemovedOccurrence(notes: string | null | undefined): boolean {
  return readRemovedMark(notes) !== null;
}

/** Adds (or refreshes) the removed marker while keeping the existing notes. */
export function markOccurrenceRemoved(
  notes: string | null | undefined,
  reason?: string
): string {
  const parsed = parseNotes(notes);
  const base = parsed ?? (notes ? { legacyNotes: notes } : {});
  return JSON.stringify({
    ...base,
    removed: {
      at: new Date().toISOString(),
      ...(reason ? { reason } : {}),
    },
  });
}

/**
 * Client helper: ids hidden from the agenda/lesson list. Notes are not readable
 * with the anon key, so the query runs in the authenticated server route.
 */
export async function fetchRemovedOccurrenceIds(): Promise<Set<string>> {
  if (typeof window === 'undefined') return new Set();
  try {
    const response = await fetch('/api/occurrences/removed', { cache: 'no-store' });
    if (!response.ok) return new Set();
    const payload = (await response.json()) as { ids?: unknown };
    return new Set(
      Array.isArray(payload.ids)
        ? payload.ids.filter((id): id is string => typeof id === 'string')
        : []
    );
  } catch {
    return new Set();
  }
}
