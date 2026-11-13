import { NextRequest, NextResponse } from 'next/server';
import { adminPatch, adminSelect, adminUpsert } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ContentRow = {
  id: string;
  title: string;
  total_min: number | null;
  version: number;
};

type ClassRow = {
  id: string;
  start_time: string;
  end_time: string;
};

type OccurrenceRow = {
  id: string;
  status: string;
  content_id: string | null;
};

function todayInSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

function timeInSaoPaulo(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date());
}

function addMinutes(time: string, minutes: number): string {
  const [hours, min] = time.split(':').map(Number);
  const total = hours * 60 + min + minutes;
  return `${String(Math.floor(total / 60) % 24).padStart(2, '0')}:${String(
    total % 60
  ).padStart(2, '0')}`;
}

export async function POST(request: NextRequest) {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const body = (await request.json().catch(() => null)) as {
      contentId?: unknown;
      classId?: unknown;
      date?: unknown;
    } | null;
    const contentId = typeof body?.contentId === 'string' ? body.contentId.trim() : '';
    const classId = typeof body?.classId === 'string' ? body.classId.trim() : '';
    const date = typeof body?.date === 'string' ? body.date.trim() : '';

    if (!/^[a-zA-Z0-9_-]{1,80}$/.test(contentId)) {
      return NextResponse.json({ error: 'Conteúdo inválido.' }, { status: 400 });
    }
    if (classId && !/^[0-9a-f-]{36}$/i.test(classId)) {
      return NextResponse.json({ error: 'Turma inválida.' }, { status: 400 });
    }
    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ error: 'Data inválida.' }, { status: 400 });
    }

    const contents = await adminSelect<ContentRow[]>(
      `pp_content?select=id,title,total_min,version&id=eq.${encodeURIComponent(contentId)}&limit=1`
    );
    const content = contents[0];
    if (!content) {
      return NextResponse.json({ error: 'content not found' }, { status: 404 });
    }

    if (!classId) {
      const day = todayInSaoPaulo();
      const startTime = timeInSaoPaulo();
      const endTime = addMinutes(startTime, content.total_min ?? 150);
      const startAt = `${day}T${startTime}:00-03:00`;
      const endAt = `${day}T${endTime}:00-03:00`;

      /* NULL class_id does not conflict in Postgres, so find the existing
         classless occurrence for this content/day before inserting another. */
      const existing = await adminSelect<OccurrenceRow[]>(
        `pp_occurrences?select=id,status,content_id&content_id=eq.${encodeURIComponent(content.id)}&class_id=is.null&date=eq.${day}&order=created_at.desc&limit=1`
      );
      if (existing[0]) {
        if (existing[0].status === 'given' || existing[0].status === 'no_students') {
          return NextResponse.json(
            { error: 'Esta aula já foi dada e está somente leitura.' },
            { status: 409 }
          );
        }
        await adminPatch('pp_occurrences', `id=eq.${existing[0].id}`, {
          start_at: startAt,
          end_at: endAt,
          content_version: content.version ?? 1,
          updated_at: new Date().toISOString(),
        });
        return NextResponse.json({ occurrenceId: existing[0].id });
      }

      await adminUpsert(
        'pp_occurrences',
        [
          {
            class_id: null,
            content_id: content.id,
            date: day,
            start_at: startAt,
            end_at: endAt,
            status: 'planned',
            content_version: content.version ?? 1,
          },
        ],
        'class_id,date,start_at',
        'merge'
      );

      const rows = await adminSelect<{ id: string }[]>(
        `pp_occurrences?select=id&content_id=eq.${encodeURIComponent(content.id)}&class_id=is.null&date=eq.${day}&order=created_at.desc&limit=1`
      );
      return NextResponse.json({ occurrenceId: rows[0]?.id ?? null });
    }

    const classes = await adminSelect<ClassRow[]>(
      `pp_classes?select=id,start_time,end_time&id=eq.${encodeURIComponent(classId)}&limit=1`
    );
    const classroom = classes[0];
    if (!classroom) {
      return NextResponse.json({ error: 'class not found' }, { status: 404 });
    }

    const startAt = `${date}T${classroom.start_time.slice(0, 5)}:00-03:00`;
    const endAt = `${date}T${classroom.end_time.slice(0, 5)}:00-03:00`;

    const existing = await adminSelect<OccurrenceRow[]>(
      `pp_occurrences?select=id,status,content_id&class_id=eq.${encodeURIComponent(classId)}&date=eq.${date}&order=start_at.asc&limit=1`
    );
    const occurrence = existing[0];

    if (occurrence) {
      if (occurrence.status === 'given' || occurrence.status === 'no_students') {
        return NextResponse.json(
          { error: 'Esta aula já foi dada e está somente leitura.' },
          { status: 409 }
        );
      }
      if (occurrence.status === 'cancelled') {
        return NextResponse.json({ error: 'Esta aula está cancelada.' }, { status: 409 });
      }
      await adminPatch('pp_occurrences', `id=eq.${occurrence.id}`, {
        content_id: content.id,
        content_version: content.version ?? 1,
        status: 'planned',
        updated_at: new Date().toISOString(),
      });
      return NextResponse.json({ occurrenceId: occurrence.id });
    }

    await adminUpsert(
      'pp_occurrences',
      [
        {
          class_id: classId,
          content_id: content.id,
          date,
          start_at: startAt,
          end_at: endAt,
          status: 'planned',
          content_version: content.version ?? 1,
        },
      ],
      'class_id,date,start_at',
      'merge'
    );

    const created = await adminSelect<{ id: string }[]>(
      `pp_occurrences?select=id&class_id=eq.${encodeURIComponent(classId)}&date=eq.${date}&order=start_at.asc&limit=1`
    );
    return NextResponse.json({ occurrenceId: created[0]?.id ?? null });
  } catch {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
