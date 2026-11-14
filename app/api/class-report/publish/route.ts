import { NextRequest, NextResponse } from 'next/server';
import { adminSelect } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';
import { normalizeStudents } from '@/lib/aula/class-report';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OccurrenceRow = {
  id: string;
  class_id: string | null;
  content_id: string | null;
  date: string;
  start_at: string;
  end_at: string;
};
type ClassRow = {
  id: string;
  short_code: string;
  discipline: string | null;
  platform_class_id: string | null;
};
type ContentRow = { unit_no: number | null; lesson_no: number | null };
type PlatformClass = {
  id: string;
  currentBookId?: string;
  current_book_id?: string;
  teacher_id?: string;
  followUpPedagogico?: { currentUnit?: string };
};
type PlatformBook = {
  id: string;
  name: string;
  bookUnits?: Array<{ id: string; title: string; index?: number }>;
};
type PlatformReport = { id: string; class_date: string };

function env() {
  return {
    api: process.env.PASSAPORTE_API_URL?.replace(/\/$/, ''),
    username: process.env.PASSAPORTE_USERNAME,
    password: process.env.PASSAPORTE_PASSWORD,
  };
}

async function signIn(api: string, username: string, password: string): Promise<string> {
  const response = await fetch(`${api}/sessions/sign-in-unified`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ username, password }),
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Passaporte login ${response.status}`);
  const payload = (await response.json()) as { token?: unknown };
  if (typeof payload.token !== 'string' || !payload.token) throw new Error('Passaporte sem token');
  return payload.token;
}

function utcHm(iso: string): string {
  const match = iso.match(/T(\d{2}):(\d{2})/);
  return match ? `${match[1]}:${match[2]}` : '00:00';
}

/**
 * Creates (or updates) the real Passaporte class report for this occurrence.
 * `dryRun` returns the exact payload without writing, for safe verification.
 */
export async function POST(request: NextRequest) {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    occurrenceId?: unknown;
    text?: unknown;
    students?: unknown;
    dryRun?: unknown;
  } | null;
  const occurrenceId = typeof body?.occurrenceId === 'string' ? body.occurrenceId.trim() : '';
  const text = typeof body?.text === 'string' ? body.text.trim().slice(0, 2000) : '';
  const students = normalizeStudents(body?.students);
  const dryRun = body?.dryRun === true;

  if (!occurrenceId || !text || students.length === 0) {
    return NextResponse.json(
      { error: 'Relatório, aula e alunos são obrigatórios para publicar.' },
      { status: 400 }
    );
  }
  const missingFeedback = students.filter(
    (student) => student.present && student.feedbacks.length === 0
  );
  if (missingFeedback.length > 0) {
    return NextResponse.json(
      {
        error: `${missingFeedback.length} aluno(s) presente(s) sem feedback comportamental.`,
      },
      { status: 400 }
    );
  }

  const config = env();
  if (!config.api || !config.username || !config.password) {
    return NextResponse.json(
      { error: 'Credenciais da plataforma não configuradas.' },
      { status: 503 }
    );
  }

  try {
    const [occurrence] = await adminSelect<OccurrenceRow[]>(
      `pp_occurrences?select=id,class_id,content_id,date,start_at,end_at&id=eq.${encodeURIComponent(
        occurrenceId
      )}&limit=1`
    );
    if (!occurrence?.class_id) {
      return NextResponse.json({ error: 'Aula sem turma vinculada.' }, { status: 404 });
    }
    const [classroom] = await adminSelect<ClassRow[]>(
      `pp_classes?select=id,short_code,discipline,platform_class_id&id=eq.${encodeURIComponent(
        occurrence.class_id
      )}&limit=1`
    );
    if (!classroom?.platform_class_id) {
      return NextResponse.json({ error: 'Turma sem vínculo com a plataforma.' }, { status: 404 });
    }
    const [content] = occurrence.content_id
      ? await adminSelect<ContentRow[]>(
          `pp_content?select=unit_no,lesson_no&id=eq.${encodeURIComponent(occurrence.content_id)}&limit=1`
        )
      : [undefined];

    const token = await signIn(config.api, config.username, config.password);
    const headers = { authorization: `Bearer ${token}`, 'content-type': 'application/json' };

    const classes = (await (
      await fetch(`${config.api}/classes/my-classes`, { headers, cache: 'no-store' })
    ).json()) as PlatformClass[];
    const platformClass = classes.find((row) => row.id === classroom.platform_class_id);
    if (!platformClass) throw new Error('Turma não encontrada na plataforma');
    const bookId = platformClass.currentBookId ?? platformClass.current_book_id ?? '';
    if (!bookId) throw new Error('Turma sem livro atual');

    const books = (await (
      await fetch(`${config.api}/class-report/books`, { headers, cache: 'no-store' })
    ).json()) as PlatformBook[];
    const book = books.find((row) => row.id === bookId);
    if (!book) throw new Error('Livro atual não encontrado');
    const lessonNumber = content?.lesson_no ?? 1;
    const unit =
      book.bookUnits?.find((row) => row.title.toLowerCase().includes(`aula ${lessonNumber}`)) ??
      book.bookUnits?.[Math.max(0, lessonNumber - 1)];
    if (!unit) throw new Error('Unidade do livro não encontrada');

    const reports = (await (
      await fetch(
        `${config.api}/class-report/${encodeURIComponent(
          classroom.platform_class_id
        )}?orderBy=classDate&order=desc&page=1&limit=100`,
        { headers, cache: 'no-store' }
      )
    ).json()) as { data?: PlatformReport[] };
    const existing = (reports.data ?? []).find(
      (report) => report.class_date.slice(0, 10) === occurrence.date
    );

    const payload = {
      ...(existing ? { id: existing.id } : {}),
      bookId,
      unitBooks: [{ unitBookId: unit.id, unitLessons: [0] }],
      classDate: `${occurrence.date}T12:00:00.000Z`,
      classId: classroom.platform_class_id,
      startClass: `${occurrence.date}T${utcHm(occurrence.start_at)}:00.000Z`,
      endClass: `${occurrence.date}T${utcHm(occurrence.end_at)}:00.000Z`,
      classInfo: text,
      teacherId: platformClass.teacher_id,
      studentInfos: students.map((student) => ({
        studentId: student.id,
        description: '',
        feedbacks: student.present ? student.feedbacks : [],
        frequency: student.present ? 'PRESENT' : 'ABSENT',
        has_material: student.present ? student.hasMaterial === true : false,
      })),
      isEnglishClass: classroom.discipline === 'info',
    };

    if (dryRun) return NextResponse.json({ ok: true, dryRun: true, payload });

    const endpoint = existing
      ? `${config.api}/class-report/update/${existing.id}`
      : `${config.api}/class-report/create`;
    const response = await fetch(endpoint, {
      method: existing ? 'PUT' : 'POST',
      headers,
      body: JSON.stringify(payload),
      cache: 'no-store',
    });
    const responseText = await response.text();
    if (!response.ok) {
      return NextResponse.json(
        { error: `Passaporte recusou o relatório (${response.status}).`, detail: responseText.slice(0, 500) },
        { status: 502 }
      );
    }

    const saved = responseText ? (JSON.parse(responseText) as { id?: string }) : {};
    return NextResponse.json({ ok: true, reportId: saved.id ?? existing?.id ?? null });
  } catch (error) {
    return NextResponse.json(
      { error: 'Não foi possível publicar na plataforma.', detail: String(error).slice(0, 300) },
      { status: 502 }
    );
  }
}
