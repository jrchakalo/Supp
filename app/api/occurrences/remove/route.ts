import { NextRequest, NextResponse } from 'next/server';
import { adminPatch, adminSelect } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';
import { isRemovedOccurrence, markOccurrenceRemoved } from '@/lib/agenda/removed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OccurrenceRow = {
  id: string;
  status: string;
  notes: string | null;
  date: string;
};

/**
 * Removes a mistaken occurrence from the cockpit (soft delete).
 *
 * The row is preserved for audit: `notes.removed` hides it from the agenda,
 * lesson list and history. A class report already published to Passaporte is
 * NOT deleted there; the UI warns about that.
 */
export async function POST(request: NextRequest) {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    occurrenceId?: unknown;
    reason?: unknown;
  } | null;

  const occurrenceId =
    typeof body?.occurrenceId === 'string' ? body.occurrenceId.trim() : '';
  if (!/^[0-9a-f-]{36}$/i.test(occurrenceId)) {
    return NextResponse.json({ error: 'Aula inválida.' }, { status: 400 });
  }

  const reason =
    typeof body?.reason === 'string' ? body.reason.trim().slice(0, 200) : undefined;

  try {
    const [occurrence] = await adminSelect<OccurrenceRow[]>(
      `pp_occurrences?select=id,status,notes,date&id=eq.${encodeURIComponent(
        occurrenceId
      )}&limit=1`
    );
    if (!occurrence) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }

    if (isRemovedOccurrence(occurrence.notes)) {
      return NextResponse.json({ ok: true, removed: true });
    }

    await adminPatch('pp_occurrences', `id=eq.${encodeURIComponent(occurrence.id)}`, {
      notes: markOccurrenceRemoved(occurrence.notes, reason),
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true, removed: true });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
