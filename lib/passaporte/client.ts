export type PassaporteClass = {
  id: string;
  name: string;
  start_hour: string;
  end_hour: string;
  day_of_week: string;
  students_count?: number;
  studentsCount?: number;
  isInactive?: boolean;
  classRoom?: { name?: string } | null;
  currentBook?: string | null;
  followUpPedagogico?: {
    currentBook?: string | null;
    currentUnit?: string | null;
    lastReport?: string | null;
  } | null;
  [key: string]: unknown;
};

export type PassaporteReport = {
  id: string;
  class_id: string;
  class_date: string;
  start_class?: string | null;
  end_class?: string | null;
  class_info?: string | null;
  teacher?: { name?: string } | null;
  surveys?: unknown;
  studentInfos?: unknown;
  [key: string]: unknown;
};

export type PassaporteSnapshot = {
  classes: PassaporteClass[];
  reports: PassaporteReport[];
};

const BASE_URL = (process.env.PASSAPORTE_API_URL || 'https://passlearn-odyk.onrender.com').replace(
  /\/$/,
  ''
);
const REQUEST_TIMEOUT_MS = 25_000;
const TOKEN_TTL_MS = 25 * 60 * 1000;

let cachedToken: { value: string; expiresAt: number } | null = null;

async function request(path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${BASE_URL}${path}`, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function login(): Promise<string> {
  const username = process.env.PASSAPORTE_USERNAME;
  const password = process.env.PASSAPORTE_PASSWORD;
  if (!username || !password) {
    throw new Error('PASSAPORTE_USERNAME/PASSAPORTE_PASSWORD missing on the server');
  }

  const response = await request('/sessions/sign-in-unified', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!response.ok) {
    throw new Error(`Passaporte login failed (${response.status})`);
  }
  const payload = (await response.json()) as { token?: unknown };
  if (typeof payload.token !== 'string' || !payload.token) {
    throw new Error('Passaporte login returned no token');
  }
  cachedToken = { value: payload.token, expiresAt: Date.now() + TOKEN_TTL_MS };
  return payload.token;
}

async function getToken(force = false): Promise<string> {
  if (!force && cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;
  return login();
}

async function getJson<T>(path: string, token: string): Promise<T> {
  const response = await request(path, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
    cache: 'no-store',
  });
  if (response.status === 401) {
    const fresh = await getToken(true);
    const retry = await request(path, {
      headers: { authorization: `Bearer ${fresh}`, accept: 'application/json' },
      cache: 'no-store',
    });
    if (!retry.ok) throw new Error(`Passaporte ${path} failed (${retry.status})`);
    return (await retry.json()) as T;
  }
  if (!response.ok) throw new Error(`Passaporte ${path} failed (${response.status})`);
  return (await response.json()) as T;
}

export async function fetchClasses(token: string): Promise<PassaporteClass[]> {
  const payload = await getJson<PassaporteClass[]>('/classes/my-classes', token);
  return Array.isArray(payload) ? payload : [];
}

export async function fetchReports(
  token: string,
  classId: string
): Promise<PassaporteReport[]> {
  const payload = await getJson<{ data?: PassaporteReport[] }>(
    `/class-report/${classId}?orderBy=classDate&order=desc&page=1&limit=100`,
    token
  );
  return Array.isArray(payload.data) ? payload.data : [];
}

export async function fetchPassaporteSnapshot(): Promise<PassaporteSnapshot> {
  const token = await getToken();
  const classes = await fetchClasses(token);

  const reports: PassaporteReport[] = [];
  const concurrency = 4;
  for (let index = 0; index < classes.length; index += concurrency) {
    const chunk = classes.slice(index, index + concurrency);
    const results = await Promise.all(
      chunk.map(async (classroom) => {
        try {
          return await fetchReports(token, classroom.id);
        } catch {
          return [];
        }
      })
    );
    for (const list of results) reports.push(...list);
  }

  return { classes, reports };
}
