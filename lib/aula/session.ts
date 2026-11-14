import { CONTENT_MODEL } from '../flags';

/**
 * Confirms that a code belongs to a real, not-yet-ended lesson occurrence.
 * The TV uses this before showing the welcome screen, so a typo cannot fake a
 * room. If the content model is legacy (or env is missing), we cannot check and
 * fall back to the teacher handshake.
 */
export async function sessionExists(code: string): Promise<boolean | null> {
  if (CONTENT_MODEL !== 'v2') return null;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;

  try {
    const response = await fetch(
      `${url}/rest/v1/pp_occurrences?select=id&session_code=eq.${encodeURIComponent(
        code
      )}&ended_at=is.null&limit=1`,
      {
        headers: {
          apikey: key,
          Authorization: `Bearer ${key}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      }
    );
    if (!response.ok) return null;
    const rows: unknown = await response.json();
    return Array.isArray(rows) && rows.length > 0;
  } catch {
    return null;
  }
}
