import { NextRequest, NextResponse } from 'next/server';
import { adminPatch, adminSelect, adminUpsert } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ContentRow = { id: string; title: string; version: number; total_min: number | null };

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      contentId?: unknown;
      title?: unknown;
      totalMin?: unknown;
      segments?: unknown;
    };
    const contentId = typeof body.contentId === 'string' ? body.contentId : '';
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const totalMin = typeof body.totalMin === 'number' ? body.totalMin : null;
    const segments = body.segments;

    if (!contentId || !title || !Array.isArray(segments) || segments.length === 0) {
      return NextResponse.json({ error: 'Dados inválidos.' }, { status: 400 });
    }

    const rows = await adminSelect<ContentRow[]>(
      `pp_content?select=id,title,version,total_min&id=eq.${encodeURIComponent(contentId)}&limit=1`
    );
    const current = rows[0];
    if (!current) {
      return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });
    }

    const version = (current.version ?? 1) + 1;
    await adminPatch('pp_content', `id=eq.${encodeURIComponent(contentId)}`, {
      title,
      total_min: totalMin,
      segments,
      version,
      updated_at: new Date().toISOString(),
    });

    await adminUpsert(
      'pp_content_versions',
      [
        {
          content_id: contentId,
          version,
          segments,
          title,
          total_min: totalMin,
          author: 'professor',
        },
      ],
      'content_id,version'
    );

    return NextResponse.json({ version });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'save failed' },
      { status: 500 }
    );
  }
}
