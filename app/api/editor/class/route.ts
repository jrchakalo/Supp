import { NextRequest, NextResponse } from 'next/server';
import { adminPatch, adminSelect, adminUpsert } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';
import { validateSegments } from '@/lib/content/validate';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ContentRow = { id: string; title: string; total_min: number | null };
type OverrideRow = { id: string };

/** "Sempre nesta turma": one whole-content override per class. */
export async function POST(request: NextRequest) {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    contentId?: unknown;
    classId?: unknown;
    segments?: unknown;
    title?: unknown;
    totalMin?: unknown;
  } | null;
  const contentId = typeof body?.contentId === 'string' ? body.contentId : '';
  const classId = typeof body?.classId === 'string' ? body.classId : '';
  const checked = validateSegments(body?.segments);

  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(contentId) || !/^[0-9a-f-]{36}$/i.test(classId)) {
    return NextResponse.json({ error: 'Conteúdo ou turma inválidos.' }, { status: 400 });
  }
  if (!checked.ok) {
    return NextResponse.json({ error: checked.error }, { status: 400 });
  }

  try {
    const [content] = await adminSelect<ContentRow[]>(
      `pp_content?select=id,title,total_min&id=eq.${encodeURIComponent(contentId)}&limit=1`
    );
    if (!content) {
      return NextResponse.json({ error: 'Conteúdo não encontrado.' }, { status: 404 });
    }

    const patch = {
      segments: checked.segments,
      title:
        typeof body?.title === 'string' && body.title.trim()
          ? body.title.trim().slice(0, 200)
          : content.title,
      totalMin:
        typeof body?.totalMin === 'number' && Number.isFinite(body.totalMin)
          ? Math.round(body.totalMin)
          : content.total_min,
    };

    const [existing] = await adminSelect<OverrideRow[]>(
      `pp_overrides?select=id&content_id=eq.${encodeURIComponent(contentId)}&scope=eq.class&scope_id=eq.${encodeURIComponent(classId)}&slide_key=eq.__segments__&limit=1`
    );

    if (existing) {
      await adminPatch('pp_overrides', `id=eq.${existing.id}`, {
        patch,
        suppressed: false,
        updated_at: new Date().toISOString(),
      });
    } else {
      await adminUpsert(
        'pp_overrides',
        [
          {
            content_id: contentId,
            scope: 'class',
            scope_id: classId,
            slide_key: '__segments__',
            patch,
            suppressed: false,
          },
        ],
        'id',
        'ignore'
      );
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
