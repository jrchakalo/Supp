import type { LiveQuestion } from './types';

/**
 * Tipos compartilhados entre a tela do professor (`/aula`) e o telão (`/tv`).
 *
 * O conteúdo institucional das aulas NÃO fica no repositório/bundle: ele é
 * carregado em runtime do Supabase por `lib/aula/lessons.ts`.
 */

export type Slide =
  | { kind: 'cover'; title: string; subtitle?: string; chips?: string[] }
  | { kind: 'bullets'; title: string; subtitle?: string; bullets: string[]; note?: string }
  | { kind: 'case'; title: string; subtitle?: string; prompt: string; options: { text: string; correct?: boolean }[]; note?: string }
  | { kind: 'code'; title: string; subtitle?: string; code: string; rows?: { left: string; right: string }[] }
  | { kind: 'table'; title: string; subtitle?: string; head: string[]; rows: string[][] }
  | { kind: 'big'; title: string; subtitle?: string; lines: string[] }
  | { kind: 'quiz'; title: string; subtitle?: string; bullets: string[] }
  | { kind: 'question'; title: string; subtitle?: string; question: string; options: string[] }
  | { kind: 'answer'; title: string; subtitle?: string; question: string; options: string[]; correctIndex: number; explanation?: string };

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
