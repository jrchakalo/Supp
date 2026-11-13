const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

function config() {
  if (!url || !serviceKey) {
    throw new Error('Supabase server env vars are missing');
  }
  return { url: url.replace(/\/$/, ''), serviceKey };
}

export async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { url: base, serviceKey: key } = config();
  const headers = new Headers(init.headers);
  headers.set('apikey', key);
  headers.set('authorization', `Bearer ${key}`);
  if (init.body) headers.set('content-type', 'application/json');
  return fetch(`${base}/rest/v1/${path}`, { ...init, headers, cache: 'no-store' });
}

export async function adminSelect<T>(path: string): Promise<T> {
  const response = await adminFetch(path, { headers: { accept: 'application/json' } });
  if (!response.ok) {
    throw new Error(`Supabase select failed (${response.status}): ${await response.text()}`);
  }
  return (await response.json()) as T;
}

export async function adminUpsert(
  table: string,
  rows: unknown[],
  onConflict: string,
  resolution: 'merge' | 'ignore' = 'merge'
): Promise<void> {
  if (rows.length === 0) return;
  const conflict = onConflict
    .split(',')
    .map((column) => encodeURIComponent(column.trim()))
    .join(',');
  const response = await adminFetch(`${table}?on_conflict=${conflict}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      prefer: `${resolution === 'ignore' ? 'resolution=ignore-duplicates' : 'resolution=merge-duplicates'},return=minimal`,
    },
    body: JSON.stringify(rows),
  });
  if (!response.ok) {
    throw new Error(`Supabase upsert ${table} failed (${response.status}): ${await response.text()}`);
  }
}

export async function adminPatch(
  table: string,
  query: string,
  body: Record<string, unknown>
): Promise<void> {
  const response = await adminFetch(`${table}?${query}`, {
    method: 'PATCH',
    headers: { accept: 'application/json', prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(`Supabase patch ${table} failed (${response.status}): ${await response.text()}`);
  }
}
