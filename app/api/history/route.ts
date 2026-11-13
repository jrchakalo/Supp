import { NextResponse } from 'next/server';
import { adminSelect } from '@/lib/supabase/admin';
import { isProfessorRequest } from '@/lib/auth/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type ReportRow = {
  id: string;
  platform_class_id: string;
  class_id: string | null;
  class_date: string;
  start_at: string | null;
  end_at: string | null;
  summary: string | null;
  class_info: string | null;
};

type ClassRow = {
  id: string;
  platform_class_id: string;
  short_code: string;
  name: string;
  discipline: string;
};

type OccurrenceRow = {
  id: string;
  platform_report_id: string | null;
  content_id: string | null;
  start_at: string | null;
  content: { title: string } | null;
};

export async function GET() {
  if (!(await isProfessorRequest())) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  try {
    const [reports, classes, occurrences] = await Promise.all([
      adminSelect<ReportRow[]>(
        'pp_reports?select=id,platform_class_id,class_id,class_date,start_at,end_at,summary,class_info&order=class_date.desc&limit=1000'
      ),
      adminSelect<ClassRow[]>(
        'pp_classes?select=id,platform_class_id,short_code,name,discipline&limit=500'
      ),
      adminSelect<OccurrenceRow[]>(
        'pp_occurrences?select=id,platform_report_id,content_id,start_at,content:pp_content(title)&platform_report_id=not.is.null&limit=1000'
      ),
    ]);

    const classByPlatform = new Map(classes.map((row) => [row.platform_class_id, row]));
    const classById = new Map(classes.map((row) => [row.id, row]));
    const occurrenceByReport = new Map(
      occurrences
        .filter((row) => row.platform_report_id)
        .map((row) => [row.platform_report_id as string, row])
    );

    const rows = reports.map((report) => {
      const occurrence = occurrenceByReport.get(report.id);
      const classroom =
        (report.class_id ? classById.get(report.class_id) : undefined) ??
        classByPlatform.get(report.platform_class_id);
      return {
        id: occurrence?.id ?? `report-${report.id}`,
        date: report.class_date,
        startAt: report.start_at ?? occurrence?.start_at ?? `${report.class_date}T00:00:00`,
        endAt: report.end_at ?? `${report.class_date}T00:00:00`,
        status: 'given',
        classId: classroom?.id ?? report.class_id,
        discipline: classroom?.discipline ?? 'Geral',
        contentId: occurrence?.content_id ?? null,
        occurrenceId: occurrence?.id ?? null,
        classCode: classroom?.short_code ?? 'Turma',
        className: classroom?.name ?? 'Turma',
        title: occurrence?.content?.title ?? 'Aula sem conteúdo vinculado',
        reportId: report.id,
        summary: report.summary ?? report.class_info ?? null,
      };
    });

    return NextResponse.json({ rows, total: rows.length });
  } catch (error) {
    console.error('[history]', error instanceof Error ? error.message : error);
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }
}
