import { NextResponse } from 'next/server';
import { adminSelect } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OccurrenceRow = {
  id: string;
  date: string;
  start_at: string;
  end_at: string;
  status: string;
  class_id: string | null;
  content_id: string | null;
  platform_report_id: string | null;
  classes: { short_code: string; name: string } | null;
  content: { title: string } | null;
};

type ReportRow = { id: string; class_info: string | null; summary: string | null };

export async function GET() {
  try {
    const [occurrences, reports] = await Promise.all([
      adminSelect<OccurrenceRow[]>(
        'pp_occurrences?select=id,date,start_at,end_at,status,class_id,content_id,platform_report_id,classes:pp_classes(short_code,name),content:pp_content(title)&order=date.desc,start_at.desc&limit=800'
      ),
      adminSelect<ReportRow[]>('pp_reports?select=id,class_info,summary&limit=1000'),
    ]);

    const reportById = new Map(reports.map((report) => [report.id, report]));
    const rows = occurrences.map((occurrence) => {
      const report = occurrence.platform_report_id
        ? reportById.get(occurrence.platform_report_id)
        : undefined;
      return {
        id: occurrence.id,
        date: occurrence.date,
        startAt: occurrence.start_at,
        endAt: occurrence.end_at,
        status: occurrence.status,
        classId: occurrence.class_id,
        contentId: occurrence.content_id,
        classCode: occurrence.classes?.short_code ?? 'Avulsa',
        className: occurrence.classes?.name ?? 'Aula avulsa',
        title: occurrence.content?.title ?? 'Aula a planejar',
        reportId: occurrence.platform_report_id,
        summary: report?.summary ?? report?.class_info ?? null,
      };
    });

    return NextResponse.json({ rows, total: rows.length });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'history failed' },
      { status: 500 }
    );
  }
}
