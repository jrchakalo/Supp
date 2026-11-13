import { NextRequest, NextResponse } from 'next/server';
import { adminPatch, adminSelect, adminUpsert } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';
import { validateSegments } from '@/lib/content/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ContentRow = {
  id: string;
  title: string;
  version: number;
  total_min: number | null;
  segments: unknown;
  discipline: string | null;
  track: string | null;
  book: string | null;
  unit_no: number | null;
  lesson_no: number | null;
  deck_id: string | null;
  status: string;
};
type VersionRow = {
  version: number;
  title: string | null;
  total_min: number | null;
  segments: unknown;
  author: string | null;
  created_at: string;
};

function unauthorized() {
  return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
}

function invalid(message = 'Dados inválidos.') {
  return NextResponse.json({ error: message }, { status: 400 });
}

function validSegments(segments: unknown): segments is unknown[] {
  return validateSegments(segments).ok;
}

export async function GET(request: NextRequest) {
  if (!(await isProfessorRequest())) return unauthorized();
  const id = request.nextUrl.searchParams.get('id')?.trim() ?? '';
  if (!id) return invalid('Conteúdo não informado.');

  try {
    const [content] = await adminSelect<ContentRow[]>(
      `pp_content?select=id,title,version,total_min,segments,discipline,track,book,unit_no,lesson_no,deck_id,status&id=eq.${encodeURIComponent(id)}&limit=1`
    );
    if (!content) return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });

    const versions = await adminSelect<VersionRow[]>(
      `pp_content_versions?select=version,title,total_min,segments,author,created_at&content_id=eq.${encodeURIComponent(id)}&order=version.desc&limit=30`
    );
    return NextResponse.json({ content, versions });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isProfessorRequest())) return unauthorized();

  const body = (await request.json().catch(() => null)) as {
    action?: unknown;
    contentId?: unknown;
    title?: unknown;
    totalMin?: unknown;
    segments?: unknown;
    version?: unknown;
  } | null;
  if (!body) return invalid();

  const action =
    body.action === 'restore' || body.action === 'duplicate' ? body.action : 'save';
  const contentId = typeof body.contentId === 'string' ? body.contentId.trim() : '';

  try {
    if (action === 'duplicate') {
      if (!contentId) return invalid('Conteúdo não informado.');
      const [source] = await adminSelect<ContentRow[]>(
        `pp_content?select=id,title,version,total_min,segments,discipline,track,book,unit_no,lesson_no,deck_id,status&id=eq.${encodeURIComponent(contentId)}&limit=1`
      );
      if (!source) return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });

      const newId = `${contentId}-copy-${Date.now().toString(36)}`.slice(0, 80);
      const title = `Cópia de ${source.title}`.slice(0, 200);
      const row = {
        id: newId,
        discipline: source.discipline ?? 'Geral',
        track: source.track,
        book: source.book,
        unit_no: source.unit_no,
        lesson_no: source.lesson_no,
        title,
        total_min: source.total_min,
        deck_id: source.deck_id,
        segments: source.segments,
        version: 1,
        status: 'published',
      };
      await adminUpsert('pp_content', [row], 'id');
      await adminUpsert(
        'pp_content_versions',
        [
          {
            content_id: newId,
            version: 1,
            segments: source.segments,
            title,
            total_min: source.total_min,
            author: 'professor:duplicate',
          },
        ],
        'content_id,version'
      );
      return NextResponse.json({ contentId: newId, version: 1 });
    }

    if (!contentId) return invalid('Conteúdo não informado.');
    const [current] = await adminSelect<ContentRow[]>(
      `pp_content?select=id,title,version,total_min,segments&id=eq.${encodeURIComponent(contentId)}&limit=1`
    );
    if (!current) return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });

    let title: string;
    let totalMin: number | null;
    let segments: unknown[];

    if (action === 'restore') {
      const version = typeof body.version === 'number' ? Math.floor(body.version) : 0;
      if (!version) return invalid('Versão inválida.');
      const [target] = await adminSelect<VersionRow[]>(
        `pp_content_versions?select=version,title,total_min,segments,author,created_at&content_id=eq.${encodeURIComponent(contentId)}&version=eq.${version}&limit=1`
      );
      if (!target || !validSegments(target.segments)) {
        return NextResponse.json({ error: 'Versão não encontrada.' }, { status: 404 });
      }
      title = (target.title ?? current.title).slice(0, 200);
      totalMin = target.total_min;
      segments = target.segments;
    } else {
      title = typeof body.title === 'string' ? body.title.trim() : '';
      totalMin =
        typeof body.totalMin === 'number' && Number.isFinite(body.totalMin)
          ? Math.round(body.totalMin)
          : null;
      segments = Array.isArray(body.segments) ? body.segments : [];
      if (!title || title.length > 200) return invalid('Título inválido.');
      if (totalMin !== null && (totalMin < 1 || totalMin > 600)) return invalid('Duração inválida.');
      if (!validSegments(segments)) return invalid('Estrutura de slides inválida.');
    }

    const nextVersion = (current.version ?? 1) + 1;
    await adminPatch('pp_content', `id=eq.${encodeURIComponent(contentId)}`, {
      title,
      total_min: totalMin,
      segments,
      version: nextVersion,
      status: 'published',
      updated_at: new Date().toISOString(),
    });
    await adminUpsert(
      'pp_content_versions',
      [
        {
          content_id: contentId,
          version: nextVersion,
          segments,
          title,
          total_min: totalMin,
          author: action === 'restore' ? 'professor:restore' : 'professor',
        },
      ],
      'content_id,version'
    );

    return NextResponse.json({ version: nextVersion });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
