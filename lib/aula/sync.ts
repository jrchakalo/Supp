import { getSupabaseClient } from '../live/supabase';
import type { Slide } from '../passaporte-lessons';

/**
 * Realtime link between the teacher screen (`/professor`) and the projector
 * (`/tela`). It is a plain broadcast channel plus presence: the projector tracks
 * `{ role: 'tv' }` so the teacher knows whether a screen is actually connected.
 *
 * The teacher is the single source of truth: it broadcasts the current slide
 * and the quiz state. A freshly-opened `/tela` says `hello`; the teacher replies
 * with `state` (current position) and re-sends the slide, so an F5 or a late
 * join always catches up.
 */

export const AULA_CHANNEL_PREFIX = 'supp-aula';

/** Channel namespace. The session code is appended: `supp-aula:AB3D9`. */
export function aulaChannelName(code: string): string {
  return `${AULA_CHANNEL_PREFIX}:${code}`;
}

/** Fixed gate code that unlocks the teacher screen. */
export const PASSAPORTE_GATE_CODE = 'AUL41';

/** localStorage key (via lib/storage) that remembers the gate was unlocked. */
export const AULA_GATE_STORAGE = 'aula-gate';
/** localStorage key (via lib/storage) with the active session for F5 recovery. */
export const AULA_SESSION_STORAGE = 'aula-session';

/** Broadcast event name used by both sides of the aula channel. */
export const AULA_EVENT = 'aula';

export type AulaSlideMessage = {
  type: 'slide';
  /** Lesson id, or `quiz` for the presentation deck generated from the quiz. */
  lessonId: string;
  /** Beat index (lesson) or slide index (quiz presentation). */
  index: number;
  /** The slide itself, so `/tela` never needs the lesson data to render it. */
  slide: Slide;
  /** Optional scene image for the current beat (e.g. the crime scene). */
  imageUrl?: string;
};

/** Texts rendered on the welcome screen (teacher + projector). */
export type AulaWelcomeContent = {
  title: string;
  message: string;
  message2: string;
};

/** Generic welcome copy used when the lesson data has no `welcome` field. */
export const AULA_WELCOME_FALLBACK: AulaWelcomeContent = {
  title: 'Bem vindos!',
  message: 'Que bom ter você aqui. A aula já vai começar.',
  message2: 'Deixe o telão aberto e acompanhe com o professor.',
};

/** Pre-class screen: the TV shows the welcome message until the first slide. */
export type AulaWelcomeMessage = {
  type: 'welcome';
  /** Lesson welcome copy, so `/tela` does not need the lesson data. */
  welcome?: AulaWelcomeContent;
};

export type AulaQuizMessage = {
  type: 'quiz';
  /** Live room code the players should type on /join. */
  code: string;
  active: true;
};

export type AulaQuizEndMessage = {
  type: 'quizEnd';
};

/** The teacher ended the lesson: `/tela` must go back to the connect screen. */
export type AulaEndMessage = {
  type: 'end';
};

/** Warm-up D20: a True/False statement rendered on the projector. */
export type AulaD20Message = {
  type: 'd20';
  text: string;
  answer: boolean;
  explanation?: string;
};

/** Warm-up D20: the teacher revealed the answer. */
export type AulaD20RevealMessage = {
  type: 'd20Reveal';
};

/** One line of the class competition scoreboard. */
export type AulaCompScore = {
  name: string;
  score: number;
};

/**
 * Warm-up competition: the teacher shows the statement + scoreboard on the TV
 * and marks the current student right/wrong before moving on.
 */
export type AulaCompMessage = {
  type: 'comp';
  student: string;
  text: string;
  answer: boolean;
  explanation?: string;
  revealed: boolean;
  scores: AulaCompScore[];
  round?: number;
  totalRounds?: number;
};

/** Warm-up competition: final ranking, shown as the TV podium. */
export type AulaCompEndMessage = {
  type: 'compEnd';
  ranking: AulaCompScore[];
};

/** Closes a D20/competition overlay so `/tela` accepts slides again. */
export type AulaWarmupEndMessage = {
  type: 'warmupEnd';
};

export type AulaHelloMessage = {
  type: 'hello';
};

export type AulaStateMessage = {
  type: 'state';
  lessonId: string;
  index: number;
  /** The current slide, so a late-joining `/tela` can catch up on its own. */
  slide: Slide;
  /** Scene image for the current beat, when the teacher picked one. */
  imageUrl?: string;
  /** Live room code when a phone quiz is running, null otherwise. */
  quiz: string | null;
};

export type AulaMessage =
  | AulaSlideMessage
  | AulaQuizMessage
  | AulaQuizEndMessage
  | AulaHelloMessage
  | AulaStateMessage
  | AulaWelcomeMessage
  | AulaEndMessage
  | AulaD20Message
  | AulaD20RevealMessage
  | AulaCompMessage
  | AulaCompEndMessage
  | AulaWarmupEndMessage;

export type AulaConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'closed'
  | 'offline';

export type AulaPresenceMember = {
  /** `tv` for the projector; other roles are ignored by the teacher screen. */
  role: 'tv' | 'teacher' | string;
  /** Per-tab identifier, so two projectors can coexist. */
  id?: string;
};

export type AulaChannelHandlers = {
  /** Any message broadcast on the channel. */
  onMessage?: (message: AulaMessage) => void;
  /** Connection lifecycle. `offline` is emitted by the screens, not here. */
  onStatus?: (status: AulaConnectionStatus) => void;
  /** Fired on every successful subscribe, including reconnects. */
  onSubscribed?: () => void;
  /** Presence snapshot (join/leave/sync) for this channel. */
  onPresence?: (members: AulaPresenceMember[]) => void;
};

export type AulaChannel = {
  code: string;
  send: (message: AulaMessage) => void;
  /** Announces this client on the channel presence. */
  track: (member: AulaPresenceMember) => void;
  remove: () => void;
};

/**
 * Opens the `supp-aula:<code>` broadcast channel.
 *
 * Returns `null` when Supabase is not configured (missing env vars) or when
 * called during SSR, so callers can show a warning instead of crashing.
 * Supabase handles reconnection internally; `onSubscribed` runs again after a
 * reconnect so the teacher can re-send state and the TV can say `hello` again.
 */
export function createAulaChannel(
  code: string,
  handlers: AulaChannelHandlers = {}
): AulaChannel | null {
  const client = getSupabaseClient();
  if (!client || !code) return null;

  handlers.onStatus?.('connecting');

  const channel = client.channel(aulaChannelName(code), {
    config: {
      presence: { key: `aula-${Math.random().toString(36).slice(2, 10)}` },
    },
  });

  const emitPresence = () => {
    if (!handlers.onPresence) return;
    const state = channel.presenceState() as Record<
      string,
      Array<Record<string, unknown>>
    >;
    const members: AulaPresenceMember[] = [];
    for (const metas of Object.values(state)) {
      const meta = metas[0];
      if (meta && typeof meta.role === 'string') {
        members.push({
          role: meta.role,
          id: typeof meta.id === 'string' ? meta.id : undefined,
        });
      }
    }
    handlers.onPresence(members);
  };

  channel
    .on('broadcast', { event: AULA_EVENT }, ({ payload }) => {
      handlers.onMessage?.(payload as AulaMessage);
    })
    .on('presence', { event: 'sync' }, emitPresence)
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        handlers.onStatus?.('connected');
        handlers.onSubscribed?.();
        emitPresence();
        return;
      }
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        handlers.onStatus?.('error');
        return;
      }
      if (status === 'CLOSED') {
        handlers.onStatus?.('closed');
      }
    });

  return {
    code,
    send: (message: AulaMessage) => {
      void channel.send({
        type: 'broadcast',
        event: AULA_EVENT,
        payload: message,
      });
    },
    track: (member: AulaPresenceMember) => {
      void channel.track(member);
    },
    remove: () => {
      void client.removeChannel(channel);
    },
  };
}
