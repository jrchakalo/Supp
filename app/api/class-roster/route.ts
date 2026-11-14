import { NextRequest, NextResponse } from 'next/server';
import { adminSelect } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OccurrenceRow = { id: string; class_id: string | null };
type ClassRow = {
  id: string;
  short_code: string;
  platform_class_id: string | null;
  platform: {
    branchCourse?: { branch_id?: string };
    branch_course_id?: string;
  } | null;
};

type PassaporteStudent = { id: string; name: string };

type CacheEntry = { at: number; students: PassaporteStudent[] };
const CACHE_TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, CacheEntry>();

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

/**
 * Returns the real class roster from Passaporte. The platform's class report
 * form toggles these same names; using the same source keeps attendance aligned.
 */
export async function GET(request: NextRequest) {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const occurrenceId = request.nextUrl.searchParams.get('occurrenceId')?.trim() ?? '';
  if (!occurrenceId) {
    return NextResponse.json({ error: 'Aula não informada.' }, { status: 400 });
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
      `pp_occurrences?select=id,class_id&id=eq.${encodeURIComponent(occurrenceId)}&limit=1`
    );
    if (!occurrence?.class_id) {
      return NextResponse.json({ error: 'Aula sem turma vinculada.' }, { status: 404 });
    }

    const [classroom] = await adminSelect<ClassRow[]>(
      `pp_classes?select=id,short_code,platform_class_id,platform&id=eq.${encodeURIComponent(
        occurrence.class_id
      )}&limit=1`
    );
    if (!classroom?.platform_class_id) {
      return NextResponse.json({ error: 'Turma sem vínculo com a plataforma.' }, { status: 404 });
    }

    const cached = cache.get(classroom.platform_class_id);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return NextResponse.json({
        students: cached.students,
        classCode: classroom.short_code,
        source: 'passaporte',
      });
    }

    const token = await signIn(config.api, config.username, config.password);
    let branchId = classroom.platform?.branchCourse?.branch_id ?? '';

    if (!branchId) {
      const classesResponse = await fetch(`${config.api}/classes/my-classes`, {
        headers: { authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!classesResponse.ok) throw new Error(`Passaporte classes ${classesResponse.status}`);
      const classes = (await classesResponse.json()) as Array<{
        id: string;
        branchCourse?: { branch_id?: string };
      }>;
      branchId = classes.find((row) => row.id === classroom.platform_class_id)?.branchCourse?.branch_id ?? '';
    }
    if (!branchId) throw new Error('Turma sem branch na plataforma');

    const rosterResponse = await fetch(
      `${config.api}/students/from-branch/${branchId}?classId=${encodeURIComponent(
        classroom.platform_class_id
      )}&pageSize=5000&includeStudentInfos=false`,
      {
        headers: { authorization: `Bearer ${token}` },
        cache: 'no-store',
      }
    );
    if (!rosterResponse.ok) throw new Error(`Passaporte roster ${rosterResponse.status}`);
    const payload = (await rosterResponse.json()) as { data?: Array<{ id?: unknown; name?: unknown }> };
    const students = (payload.data ?? [])
      .map((student) => ({
        id: typeof student.id === 'string' ? student.id : '',
        name: typeof student.name === 'string' ? student.name.trim() : '',
      }))
      .filter((student) => student.id && student.name)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    cache.set(classroom.platform_class_id, { at: Date.now(), students });
    return NextResponse.json({
      students,
      classCode: classroom.short_code,
      source: 'passaporte',
    });
  } catch {
    return NextResponse.json(
      { error: 'Não foi possível carregar a chamada da plataforma.' },
      { status: 502 }
    );
  }
}
