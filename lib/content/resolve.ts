import type { Segment } from '../passaporte-lessons';

export type ContentOverride = {
  segments?: Segment[];
  title?: string;
  totalMin?: number | null;
};

export type ResolutionInput = {
  /** Frozen snapshot of a lesson that was already given. */
  snapshot: Segment[] | null;
  content: Segment[];
  classOverride?: ContentOverride | null;
  occurrenceOverride?: ContentOverride | null;
};

/**
 * Precedence: snapshot → occurrence → class → canonical content.
 * A snapshot is immutable; overrides only affect lessons that are not frozen.
 */
export function resolveSegments(input: ResolutionInput): Segment[] {
  if (Array.isArray(input.snapshot) && input.snapshot.length > 0) return input.snapshot;
  if (Array.isArray(input.occurrenceOverride?.segments)) {
    return input.occurrenceOverride.segments;
  }
  if (Array.isArray(input.classOverride?.segments)) return input.classOverride.segments;
  return input.content;
}

export function resolveTitle(
  contentTitle: string,
  occurrenceOverride?: ContentOverride | null,
  classOverride?: ContentOverride | null
): string {
  return occurrenceOverride?.title ?? classOverride?.title ?? contentTitle;
}

export function resolveTotalMin(
  contentTotal: number,
  occurrenceOverride?: ContentOverride | null,
  classOverride?: ContentOverride | null
): number {
  return (
    occurrenceOverride?.totalMin ??
    classOverride?.totalMin ??
    contentTotal
  );
}
