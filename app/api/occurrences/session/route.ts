import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminPatch, adminSelect } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';
import { validateSegments } from '@/lib/content/validate';
import { sanitizeRoomCode } from '@/lib/live/room';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OccurrenceRow = {
  id: string;
  status: string;
  content_id: string | null;
  snapshot: unknown;
  snapshot_hash: string | null;
  session_code: string | null;
  started_at: string | null;
};

const LOCKED = new Set(['given', 'no_students', 'cancelled']);

export async function POST(request: NextRequest) {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    occurrenceId?: unknown;
    contentId?: unknown;
    sessionCode?: unknown;
    snapshot?: unknown;
    action?: unknown;
  } | null;
  const occurrenceId = typeof body?.occurrenceId === 'string' ? body.occurrenceId : '';
  const contentId = typeof body?.contentId === 'string' ? body.contentId : '';
  const sessionCode = typeof body?.sessionCode === 'string' ? body.sessionCode : '';
  const action = body?.action === 'end' ? 'end' : 'start';

  if (!occurrenceId) {
    return NextResponse.json({ error: 'Aula não informada.' }, { status: 400 });
  }

  try {
    const [occurrence] = await adminSelect<OccurrenceRow[]>(
      `pp_occurrences?select=id,status,content_id,snapshot,snapshot_hash,session_code,started_at&id=eq.${encodeURIComponent(occurrenceId)}&limit=1`
    );
    if (!occurrence) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }
    if (contentId && occurrence.content_id && occurrence.content_id !== contentId) {
      return NextResponse.json({ error: 'Aula não pertence a este conteúdo.' }, { status: 400 });
    }

    if (action === 'end') {
      await adminPatch('pp_occurrences', `id=eq.${encodeURIComponent(occurrenceId)}`, {
        ended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ ok: true });
    }

    if (LOCKED.has(occurrence.status)) {
      return NextResponse.json({
        ok: true,
        readOnly: true,
        sessionCode: occurrence.session_code,
      });
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
      started_at: occurrence.started_at ?? new Date().toISOString(),
      ended_at: null,
    };

    const code = sanitizeRoomCode(sessionCode);
    if (code) patch.session_code = code;

    /* Freeze the first snapshot only: later edits during the lesson must not
       mutate what was given. */
    if (!occurrence.snapshot) {
      const checked = validateSegments(body?.snapshot);
      if (checked.ok) {
        patch.snapshot = checked.segments;
        patch.snapshot_hash = createHash('sha256')
          .update(JSON.stringify(checked.segments))
          .digest('hex');
      }
    }

    await adminPatch('pp_occurrences', `id=eq.${encodeURIComponent(occurrenceId)}`, patch);
    return NextResponse.json({
      ok: true,
      sessionCode: (patch.session_code as string | undefined) ?? occurrence.session_code,
      snapshotHash: patch.snapshot_hash ?? occurrence.snapshot_hash,
    });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
