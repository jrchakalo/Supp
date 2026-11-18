import { NextResponse } from 'next/server';
import { adminSelect } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';
import { isRemovedOccurrence } from '@/lib/agenda/removed';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Row = { id: string; notes: string | null };

/**
 * Ids of occurrences hidden by the "Remover aula" action. `notes` is
 * server-only, so the cockpit asks this route instead of reading it with the
 * anon key.
 */
export async function GET() {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const rows = await adminSelect<Row[]>(
      'pp_occurrences?select=id,notes&limit=2000'
    );
    const ids = rows
      .filter((row) => isRemovedOccurrence(row.notes))
      .map((row) => row.id);
    return NextResponse.json({ ids });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
