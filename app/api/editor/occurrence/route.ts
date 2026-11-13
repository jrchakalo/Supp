import { createHash } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { adminPatch, adminSelect } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';
import { validateSegments } from '@/lib/content/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OccurrenceRow = {
  id: string;
  status: string;
  content_id: string | null;
  notes: string | null;
};

type AuditEntry = {
  action: 'corrigir-registro';
  at: string;
  contentId: string;
  reason: string;
};

function readAudit(notes: string | null): { legacyNotes?: string; audit: AuditEntry[] } {
  if (!notes) return { audit: [] };
  try {
    const parsed = JSON.parse(notes) as { legacyNotes?: unknown; audit?: unknown };
    return {
      legacyNotes: typeof parsed.legacyNotes === 'string' ? parsed.legacyNotes : undefined,
      audit: Array.isArray(parsed.audit) ? (parsed.audit as AuditEntry[]).slice(-40) : [],
    };
  } catch {
    return { legacyNotes: notes, audit: [] };
  }
}

export async function POST(request: NextRequest) {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    occurrenceId?: unknown;
    contentId?: unknown;
    segments?: unknown;
    correction?: unknown;
    reason?: unknown;
  } | null;
  const occurrenceId = typeof body?.occurrenceId === 'string' ? body.occurrenceId : '';
  const contentId = typeof body?.contentId === 'string' ? body.contentId : '';
  const checked = validateSegments(body?.segments);
  const correction = body?.correction === true;
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) : '';

  if (!occurrenceId || !contentId || !checked.ok) {
    return NextResponse.json(
      { error: checked.ok ? 'Dados inválidos.' : checked.error },
      { status: 400 }
    );
  }
  if (correction && reason.length < 10) {
    return NextResponse.json(
      { error: 'Descreva o motivo da correção (mínimo 10 caracteres).' },
      { status: 400 }
    );
  }

  try {
    const [occurrence] = await adminSelect<OccurrenceRow[]>(
      `pp_occurrences?select=id,status,content_id,notes&id=eq.${encodeURIComponent(occurrenceId)}&limit=1`
    );
    if (!occurrence) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }
    if (!occurrence.content_id || occurrence.content_id !== contentId) {
      return NextResponse.json(
        { error: 'A aula não pertence a este conteúdo.' },
        { status: 400 }
      );
    }

    const locked =
      occurrence.status === 'given' ||
      occurrence.status === 'no_students' ||
      occurrence.status === 'cancelled';
    if (locked && !correction) {
      return NextResponse.json(
        { error: 'Aula já dada/cancelada: use “Corrigir registro” com confirmação.' },
        { status: 409 }
      );
    }

    const snapshotHash = createHash('sha256')
      .update(JSON.stringify(checked.segments))
      .digest('hex');

    const patch: Record<string, unknown> = {
      snapshot: checked.segments,
      snapshot_hash: snapshotHash,
      content_version: null,
      updated_at: new Date().toISOString(),
    };

    if (correction && locked) {
      const audit = readAudit(occurrence.notes);
      patch.notes = JSON.stringify({
        ...(audit.legacyNotes ? { legacyNotes: audit.legacyNotes } : {}),
        audit: [
          ...audit.audit,
          {
            action: 'corrigir-registro',
            at: new Date().toISOString(),
            contentId,
            reason,
          } satisfies AuditEntry,
        ],
      });
    } else {
      patch.status = 'planned';
    }

    await adminPatch('pp_occurrences', `id=eq.${encodeURIComponent(occurrence.id)}`, patch);
    return NextResponse.json({ ok: true, hash: snapshotHash });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
