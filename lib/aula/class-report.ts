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
  goodPerformance: boolean;
  at: string;
};

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
      goodPerformance: report.goodPerformance === true,
      at: typeof report.at === 'string' ? report.at : '',
    };
  } catch {
    return null;
  }
}
