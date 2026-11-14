import type { ClassReportTemplate } from '../passaporte-lessons';

/**
 * Class report = duas frases padrão (~80 caracteres cada) escritas junto com a
 * aula + uma terceira frase opcional quando a turma teve bom desempenho.
 * A presença entra como metadado; no texto, só aparece quando ninguém veio.
 */

export type ClassReportInput = {
  template: ClassReportTemplate;
  present: string[];
  goodPerformance: boolean;
};

export type StoredClassReport = {
  text: string;
  present: string[];
  presentStudentIds?: string[];
  students?: StudentAttendance[];
  goodPerformance: boolean;
  at: string;
};

export type FeedbackNature = 'good' | 'bad';

export type BehaviorFeedback = {
  value: string;
  label: string;
  nature: FeedbackNature;
  points: number;
};

/** Same values and points as the Passaporte behavioral feedback form. */
export const BEHAVIOR_FEEDBACKS: BehaviorFeedback[] = [
  { value: 'Planning', label: 'Planejamento', nature: 'good', points: 140 },
  { value: 'Collaboration', label: 'Colaboração', nature: 'good', points: 80 },
  { value: 'Self-Control', label: 'Autocontrole', nature: 'good', points: 80 },
  { value: 'Collaborative Leadership', label: 'Liderança Colaborativa', nature: 'good', points: 80 },
  { value: 'Creativity', label: 'Criatividade', nature: 'good', points: 80 },
  { value: 'Disrespect', label: 'Desrespeito', nature: 'bad', points: 200 },
  { value: 'Misbehavior', label: 'Mau comportamento', nature: 'bad', points: 150 },
  { value: 'Attention', label: 'Falta de atenção', nature: 'bad', points: 50 },
  { value: 'Device distraction', label: 'Mau uso de recursos digitais', nature: 'bad', points: 50 },
  { value: 'Disorganization', label: 'Desorganização', nature: 'bad', points: 50 },
  { value: 'Intentional isolation', label: 'Isolamento intencional', nature: 'bad', points: 50 },
];

export const DEFAULT_PRESENT_FEEDBACKS = ['Collaboration', 'Self-Control'];
export const GOOD_PERFORMANCE_FEEDBACK = 'Creativity';
export const MAX_GOOD_FEEDBACKS = 5;
export const MAX_BAD_FEEDBACKS = 3;

export type StudentAttendance = {
  id: string;
  name: string;
  present: boolean;
  feedbacks: string[];
  hasMaterial: boolean | null;
};

const FEEDBACK_VALUES = new Set(BEHAVIOR_FEEDBACKS.map((feedback) => feedback.value));

export function feedbackByValue(value: string): BehaviorFeedback | undefined {
  return BEHAVIOR_FEEDBACKS.find((feedback) => feedback.value === value);
}

function clean(value: string): string {
  return value.replace(/\s+/g, ' ').trim();
}

export function normalizeAttendance(present: unknown): string[] {
  if (!Array.isArray(present)) return [];
  const seen = new Set<string>();
  const names: string[] = [];
  for (const entry of present) {
    if (typeof entry !== 'string') continue;
    const name = clean(entry).slice(0, 80);
    if (!name) continue;
    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    names.push(name);
    if (names.length >= 60) break;
  }
  return names;
}

export function normalizeStudentIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const ids = value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0);
  return Array.from(new Set(ids)).slice(0, 100);
}

export function normalizeStudents(value: unknown): StudentAttendance[] {
  if (!Array.isArray(value)) return [];
  const students: StudentAttendance[] = [];
  for (const raw of value.slice(0, 100)) {
    if (!raw || typeof raw !== 'object') continue;
    const row = raw as Record<string, unknown>;
    const name = typeof row.name === 'string' ? clean(row.name).slice(0, 120) : '';
    if (!name) continue;
    const feedbacks = Array.isArray(row.feedbacks)
      ? Array.from(
          new Set(
            row.feedbacks.filter(
              (feedback): feedback is string =>
                typeof feedback === 'string' && FEEDBACK_VALUES.has(feedback)
            )
          )
        ).slice(0, 8)
      : [];
    students.push({
      id: typeof row.id === 'string' ? row.id : '',
      name,
      present: row.present === true,
      feedbacks,
      hasMaterial: row.hasMaterial === true ? true : row.hasMaterial === false ? false : null,
    });
  }
  return students;
}

export function isValidTemplate(value: unknown): value is ClassReportTemplate {
  if (!value || typeof value !== 'object') return false;
  const template = value as Partial<ClassReportTemplate>;
  const valid = (field: unknown) => typeof field === 'string' && field.length <= 600;
  return (
    valid(template.prefix) &&
    valid(template.learning) &&
    valid(template.activity) &&
    (template.praise === undefined || valid(template.praise))
  );
}

export function composeClassReport({
  template,
  present,
  goodPerformance,
}: ClassReportInput): string {
  const names = normalizeAttendance(present);
  const parts = [template.prefix, template.learning, template.activity];
  if (goodPerformance && template.praise) parts.push(template.praise);
  if (names.length === 0) parts.push('Nenhum aluno compareceu.');
  return parts.map(clean).filter(Boolean).join(' ');
}

/** Reads the JSON stored in `pp_occurrences.notes` without leaking audit data. */
export function readStoredClassReport(notes: unknown): StoredClassReport | null {
  if (typeof notes !== 'string' || !notes.trim()) return null;
  try {
    const parsed = JSON.parse(notes) as { classReport?: unknown };
    const report = parsed.classReport as Partial<StoredClassReport> | undefined;
    if (!report || typeof report.text !== 'string') return null;
    return {
      text: report.text,
      present: normalizeAttendance(report.present),
      presentStudentIds: normalizeStudentIds(report.presentStudentIds),
      students: normalizeStudents((report as { students?: unknown }).students),
      goodPerformance: report.goodPerformance === true,
      at: typeof report.at === 'string' ? report.at : '',
    };
  } catch {
    return null;
  }
}
