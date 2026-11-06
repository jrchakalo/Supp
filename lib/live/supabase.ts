import { createClient } from '@supabase/supabase-js';

/**
 * Lazily builds the Supabase realtime client for the Live room mode.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
 * (see .env.example). When they are missing, `getSupabaseClient()` returns
 * null and the Live screens show a setup warning instead of crashing.
 */

let client: ReturnType<typeof createClient> | null = null;
let warned = false;

export function getSupabaseClient() {
  if (typeof window === 'undefined') return null;
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    if (!warned) {
      warned = true;
      console.warn(
        '[supp-live] Realtime is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local.'
      );
    }
    return null;
  }

  client = createClient(url, anonKey, {
    auth: { persistSession: false },
    realtime: { params: { eventsPerSecond: 60 } },
  });

  return client;
}
