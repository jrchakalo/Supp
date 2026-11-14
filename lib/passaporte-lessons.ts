import type { LiveQuestion } from './types';

/**
 * Tipos compartilhados entre a tela do professor (`/professor`) e o telão (`/tela`).
 *
 * O conteúdo institucional das aulas NÃO fica no repositório/bundle: ele é
 * carregado em runtime do Supabase por `lib/professor/lessons.ts`.
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
  /**
   * Link-only image slide: the teacher pastes an image URL on the notebook and
   * the TV renders it for `seconds` (default 3) before hiding it. Nothing is
   * uploaded — the TV only loads the link.
   */
  | {
      kind: 'flash';
      title?: string;
      subtitle?: string;
      imageUrl?: string;
      /** How long the image stays on the TV. Defaults to 3 seconds. */
      seconds?: number;
      /** Anotação do professor — nunca aparece no telão. */
      note?: string;
      teacherNote?: string;
    }
  | { kind: 'big'; title: string; subtitle?: string; lines: string[]; teacherNote?: string }
  | { kind: 'quiz'; title: string; subtitle?: string; bullets: string[]; teacherNote?: string }
  | {
      kind: 'question';
      title: string;
      subtitle?: string;
      question: string;
      options: string[];
      /** Tradução em português, revelada depois de `translationDelayMs`. */
      textPt?: string;
      optionsPt?: string[];
      translationDelayMs?: number;
      teacherNote?: string;
    }
  | {
      kind: 'answer';
      title: string;
      subtitle?: string;
      question: string;
      options: string[];
      correctIndex: number;
      explanation?: string;
      textPt?: string;
      optionsPt?: string[];
      translationDelayMs?: number;
      teacherNote?: string;
    };

/**
 * Texto-base do class report, escrito junto com a aula. O professor só
 * confirma a presença e o tom (bom desempenho) no intervalo.
 */
export type ClassReportTemplate = {
  /** Ex.: "Projeto 6 ; Aula 3 -" ou "Unit 2 ; Lesson 2:". */
  prefix: string;
  /** Frase de ~80 caracteres sobre o que a turma aprendeu. */
  learning: string;
  /** Frase de ~80 caracteres sobre a atividade realizada. */
  activity: string;
  /** Terceira frase, opcional, quando a turma teve bom desempenho. */
  praise?: string;
};

export type Segment = {
  id: string;
  label: string;
  minutes: number;
  talk: string[];
  do: string[];
  slides: Slide[];
  /** Presente no bloco de intervalo das aulas novas. */
  classReport?: ClassReportTemplate;
};

/** Texts shown on the welcome screen before the lesson starts. */
export type LessonWelcome = {
  title: string;
  message: string;
  message2: string;
};

export type Lesson = {
  id: string;
  deckId: string;
  title: string;
  turma: string;
  date: string;
  totalMin: number;
  segments: Segment[];
  /** Optional welcome copy coming from the lesson data (Supabase). */
  welcome?: LessonWelcome;
  /** v2: the occurrence this lesson belongs to (class + date). */
  occurrenceId?: string;
  classId?: string | null;
  contentId?: string;
  status?: string;
  /** Persisted room code so a reload/another device keeps the same QR. */
  sessionCode?: string | null;
  /** Short class code, used for the alternating-week filter. */
  classCode?: string | null;
  /** Saved class report text for this occurrence, when it exists. */
  classReportText?: string | null;
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
