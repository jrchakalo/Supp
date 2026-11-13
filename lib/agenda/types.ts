export type AgendaClass = {
  id: string;
  short_code: string;
  name: string;
  discipline: string;
  weekday: number;
  start_time: string;
  end_time: string;
  room: string | null;
};

export type AgendaOccurrence = {
  id: string;
  class_id: string | null;
  content_id: string | null;
  date: string;
  start_at: string;
  end_at: string;
  status: string;
  platform_report_id: string | null;
};

export type CalendarRule = {
  weekday: number | null;
  date: string | null;
  from_date: string;
  to_date: string | null;
  kind: string;
  label: string;
};

export type AgendaContent = { id: string; title: string };

export type AgendaData = {
  occurrences: AgendaOccurrence[];
  classes: AgendaClass[];
  rules: CalendarRule[];
  contents: AgendaContent[];
};

export const STATUS_LABEL: Record<string, string> = {
  given: 'Dada',
  no_students: 'Sem alunos',
  planned: 'Prevista',
  unplanned: 'A planejar',
  cancelled: 'Cancelada',
  missed: 'Não dada',
  holiday: 'Folga',
};
