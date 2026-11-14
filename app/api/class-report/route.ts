import { NextRequest, NextResponse } from 'next/server';
import { adminPatch, adminSelect } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';
import {
  composeClassReport,
  isValidTemplate,
  normalizeAttendance,
  readStoredClassReport,
} from '@/lib/aula/class-report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OccurrenceRow = {
  id: string;
  status: string;
  notes: string | null;
};

/** Keeps the audit trail and legacy notes while replacing only the report. */
function mergeNotes(notes: string | null, classReport: unknown): string {
  let base: Record<string, unknown> = {};
  if (notes) {
    try {
      const parsed: unknown = JSON.parse(notes);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        base = parsed as Record<string, unknown>;
      } else {
        base = { legacyNotes: notes };
      }
    } catch {
      base = { legacyNotes: notes };
    }
  }
  return JSON.stringify({ ...base, classReport });
}

export async function GET(request: NextRequest) {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  const occurrenceId = request.nextUrl.searchParams.get('occurrenceId')?.trim() ?? '';
  if (!occurrenceId) {
    return NextResponse.json({ error: 'Aula não informada.' }, { status: 400 });
  }
  try {
    const [occurrence] = await adminSelect<OccurrenceRow[]>(
      `pp_occurrences?select=id,status,notes&id=eq.${encodeURIComponent(occurrenceId)}&limit=1`
    );
    if (!occurrence) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({
      report: readStoredClassReport(occurrence.notes),
      status: occurrence.status,
    });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    occurrenceId?: unknown;
    template?: unknown;
    present?: unknown;
    goodPerformance?: unknown;
  } | null;

  const occurrenceId = typeof body?.occurrenceId === 'string' ? body.occurrenceId.trim() : '';
  const template = body?.template;
  const present = normalizeAttendance(body?.present);
  const goodPerformance = body?.goodPerformance === true;

  if (!occurrenceId || !isValidTemplate(template)) {
    return NextResponse.json({ error: 'Dados do relatório inválidos.' }, { status: 400 });
  }

  try {
    const [occurrence] = await adminSelect<OccurrenceRow[]>(
      `pp_occurrences?select=id,status,notes&id=eq.${encodeURIComponent(occurrenceId)}&limit=1`
    );
    if (!occurrence) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }
    if (occurrence.status === 'cancelled') {
      return NextResponse.json({ error: 'Aula cancelada: não gera relatório.' }, { status: 409 });
    }

    const text = composeClassReport({ template, present, goodPerformance });
    const classReport = {
      text,
      present,
      goodPerformance,
      at: new Date().toISOString(),
    };
    const status = present.length === 0 ? 'no_students' : 'given';

    await adminPatch('pp_occurrences', `id=eq.${encodeURIComponent(occurrence.id)}`, {
      notes: mergeNotes(occurrence.notes, classReport),
      status,
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, text, status });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
