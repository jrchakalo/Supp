export type SegmentValidation =
  | { ok: true; segments: unknown[] }
  | { ok: false; error: string };

/**
 * Shared payload guard for content/occurrence writes. Keeps a malformed or
 * oversized payload from reaching the projector or the database.
 */
export function validateSegments(segments: unknown): SegmentValidation {
  if (!Array.isArray(segments) || segments.length === 0) {
    return { ok: false, error: 'Estrutura de slides vazia.' };
  }
  if (segments.length > 300) {
    return { ok: false, error: 'Muitos blocos no conteúdo.' };
  }
  if (JSON.stringify(segments).length > 240_000) {
    return { ok: false, error: 'Conteúdo grande demais.' };
  }
  const valid = segments.every(
    (segment) =>
      segment !== null &&
      typeof segment === 'object' &&
      typeof (segment as { id?: unknown }).id === 'string' &&
      (segment as { id: string }).id.length > 0
  );
  return valid
    ? { ok: true, segments }
    : { ok: false, error: 'Bloco sem identificador estável.' };
}
