import { createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';

/**
 * Server-side professor session. The client gate is only a convenience; every
 * route that reads reports or writes content must check this signed cookie.
 */

export const PROFESSOR_COOKIE = 'supp-prof';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000;

function secret(): string | null {
  return (
    process.env.PROFESSOR_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.CRON_SECRET ||
    null
  );
}

function sign(payload: string, key: string): string {
  return createHmac('sha256', key).update(payload).digest('base64url');
}

export function issueProfessorToken(): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(
    JSON.stringify({ exp: Date.now() + SESSION_TTL_MS })
  ).toString('base64url');
  return `${payload}.${sign(payload, key)}`;
}

export function verifyProfessorToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const key = secret();
  if (!key) return false;
  const [payload, signature] = token.split('.');
  if (!payload || !signature) return false;

  const expected = sign(payload, key);
  const given = Buffer.from(signature);
  const wanted = Buffer.from(expected);
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) return false;

  try {
    const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as {
      exp?: unknown;
    };
    return typeof parsed.exp === 'number' && parsed.exp > Date.now();
  } catch {
    return false;
  }
}

export async function isProfessorRequest(): Promise<boolean> {
  const store = await cookies();
  return verifyProfessorToken(store.get(PROFESSOR_COOKIE)?.value);
}

export function professorCookieOptions(secure: boolean) {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure,
    path: '/',
    maxAge: SESSION_TTL_MS / 1000,
  };
}
