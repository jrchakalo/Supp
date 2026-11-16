/**
 * Random draw helpers shared by the classroom games.
 *
 * The draw prefers questions that are not in the cross-run history (`recent`)
 * and not already used in the current run (`used`). When everything has been
 * seen it falls back to the least restrictive pool, so a run never stops early
 * just because the teacher played a lot that day.
 */

export function pickUnseen<T extends { id: string }>(
  pool: readonly T[],
  recent: ReadonlySet<string>,
  used: ReadonlySet<string> = new Set()
): T | null {
  if (pool.length === 0) return null;

  const available = pool.filter((item) => !used.has(item.id));
  const unseen = available.filter((item) => !recent.has(item.id));
  const candidates =
    unseen.length > 0 ? unseen : available.length > 0 ? available : pool;

  return candidates[Math.floor(Math.random() * candidates.length)] ?? null;
}

/** Picks only a question that is neither in the history nor used in the run. */
export function pickFresh<T extends { id: string }>(
  pool: readonly T[],
  recent: ReadonlySet<string>,
  used: ReadonlySet<string> = new Set()
): T | null {
  const fresh = pool.filter(
    (item) => !used.has(item.id) && !recent.has(item.id)
  );
  return fresh.length > 0
    ? fresh[Math.floor(Math.random() * fresh.length)]
    : null;
}

/** Draws up to `count` distinct questions from `pool`. */
export function pickUnseenMany<T extends { id: string }>(
  pool: readonly T[],
  count: number,
  recent: ReadonlySet<string>,
  used: ReadonlySet<string> = new Set()
): T[] {
  const picked: T[] = [];
  const taken = new Set(used);

  while (picked.length < count) {
    const item = pickUnseen(pool, recent, taken);
    if (!item || taken.has(item.id)) break;
    picked.push(item);
    taken.add(item.id);
    if (taken.size >= pool.length && picked.length < count) break;
  }

  return picked;
}
