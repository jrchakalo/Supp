import type { LiveQuestion } from './types';

/**
 * Tipos compartilhados entre a tela do professor (`/aula`) e o telão (`/tv`).
 *
 * O conteúdo institucional das aulas NÃO fica no repositório/bundle: ele é
 * carregado em runtime do Supabase por `lib/aula/lessons.ts`.
 */

/**
 * Opção de um slide `case`. O conteúdo atual vem como `{ text }`, mas aceitamos
 * string pura para que o telão continue tolerante a dados antigos.
 */
export type CaseOption = string | { text: string; correct?: boolean };

export type Slide =
  | { kind: 'cover'; title: string; subtitle?: string; chips?: string[]; teacherNote?: string }
  | {
      kind: 'bullets';
      title: string;
      subtitle?: string;
      bullets: string[];
      /** Anotação do professor — nunca aparece no telão. */
      note?: string;
      teacherNote?: string;
    }
  | {
      kind: 'case';
      title: string;
      subtitle?: string;
      prompt: string;
      options: CaseOption[];
      /** Índice 0-based da opção correta. */
      correct: number;
      /** Quando true, o telão mostra a resposta e a nota do rodapé. */
      revealed?: boolean;
      /** Anotação do professor — só aparece no telão quando `revealed`. */
      note?: string;
      teacherNote?: string;
    }
  | {
      kind: 'code';
      title: string;
      subtitle?: string;
      code: string;
      rows?: { left: string; right: string }[];
      teacherNote?: string;
    }
  | { kind: 'table'; title: string; subtitle?: string; head: string[]; rows: string[][]; teacherNote?: string }
  | { kind: 'big'; title: string; subtitle?: string; lines: string[]; teacherNote?: string }
  | { kind: 'quiz'; title: string; subtitle?: string; bullets: string[]; teacherNote?: string }
  | { kind: 'question'; title: string; subtitle?: string; question: string; options: string[]; teacherNote?: string }
  | {
      kind: 'answer';
      title: string;
      subtitle?: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
      teacherNote?: string;
    };

export type Segment = {
  id: string;
  label: string;
  minutes: number;
  talk: string[];
  do: string[];
  slides: Slide[];
};

export type Lesson = {
  id: string;
  deckId: string;
  title: string;
  turma: string;
  date: string;
  totalMin: number;
  segments: Segment[];
};

export type QuizDeck = { id: string; title: string; questions: LiveQuestion[] };

/** Todos os beats da aula, achatados, para navegação professor → TV. */
export type Beat = { segmentId: string; segmentLabel: string; minutes: number; talk: string[]; do: string[]; slide: Slide; index: number };

export function flattenBeats(lesson: Lesson): Beat[] {
  const beats: Beat[] = [];
  lesson.segments.forEach((segment) => {
    segment.slides.forEach((slide, i) => {
      beats.push({
        segmentId: segment.id,
        segmentLabel: segment.label,
        minutes: segment.minutes,
        talk: i === 0 ? segment.talk : [],
        do: i === 0 ? segment.do : [],
        slide,
        index: beats.length
      });
    });
  });
  return beats;
}
