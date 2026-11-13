import { NextRequest, NextResponse } from 'next/server';
import { adminPatch, adminSelect } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OccurrenceRow = {
  id: string;
  status: string;
  content_id: string | null;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      occurrenceId?: unknown;
      segments?: unknown;
    };
    const occurrenceId = typeof body.occurrenceId === 'string' ? body.occurrenceId : '';
    const segments = body.segments;

    if (!occurrenceId || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const rows = await adminSelect<OccurrenceRow[]>(
      `pp_occurrences?select=id,status,content_id&id=eq.${encodeURIComponent(occurrenceId)}&limit=1`
    );
    const occurrence = rows[0];
    if (!occurrence) {
      return NextResponse.json({ error: 'Aula não encontrada.' }, { status: 404 });
    }
    if (!occurrence.content_id) {
      return NextResponse.json(
        { error: 'Esta aula ainda não tem conteúdo atribuído.' },
        { status: 400 }
      );
    }
    if (
      occurrence.status === 'given' ||
      occurrence.status === 'no_students' ||
      occurrence.status === 'cancelled'
    ) {
      return NextResponse.json(
        { error: 'Aula já dada/cancelada: somente leitura. Use uma edição global para as próximas.' },
        { status: 409 }
      );
    }

    await adminPatch('pp_occurrences', `id=eq.${occurrence.id}`, {
      snapshot: segments,
      status: 'planned',
      updated_at: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'save failed' },
      { status: 500 }
    );
  }
}
