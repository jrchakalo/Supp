import { timingSafeEqual } from 'node:crypto';
import { NextResponse, type NextRequest } from 'next/server';
import { PASSAPORTE_GATE_CODE } from '@/lib/aula/sync';
import {
  PROFESSOR_COOKIE,
  isProfessorRequest,
  issueProfessorToken,
  professorCookieOptions,
} from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function sameCode(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function GET() {
  return NextResponse.json({ ok: await isProfessorRequest() });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof body?.code === 'string' ? body.code.trim().toUpperCase() : '';
  const expected = (process.env.PROFESSOR_GATE_CODE || PASSAPORTE_GATE_CODE).toUpperCase();

  if (!code || !sameCode(code, expected)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const token = issueProfessorToken();
  if (!token) {
    return NextResponse.json({ error: 'session unavailable' }, { status: 500 });
  }

  const response = NextResponse.json({ ok: true });
  const secure =
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https';
  response.cookies.set(PROFESSOR_COOKIE, token, professorCookieOptions(secure));
  return response;
}

export async function DELETE(request: NextRequest) {
  const response = NextResponse.json({ ok: true });
  const secure =
    request.nextUrl.protocol === 'https:' ||
    request.headers.get('x-forwarded-proto') === 'https';
  response.cookies.set(PROFESSOR_COOKIE, '', {
    ...professorCookieOptions(secure),
    maxAge: 0,
  });
  return response;
}
