import { getSupabaseClient } from '../live/supabase';
import type { Slide } from '../passaporte-lessons';

/**
 * Realtime link between the teacher screen (`/aula`) and the projector
 * (`/tv`). It is a plain broadcast channel — no presence, no persistence.
 *
 * The teacher is the single source of truth: it broadcasts the current slide
 * and the quiz state. A freshly-opened `/tv` says `hello`; the teacher replies
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
  /** The slide itself, so `/tv` never needs the lesson data to render it. */
  slide: Slide;
  /** Optional scene image for the current beat (e.g. the crime scene). */
  imageUrl?: string;
};

/** Pre-class screen: the TV shows the welcome message until the first slide. */
export type AulaWelcomeMessage = {
  type: 'welcome';
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

export type AulaHelloMessage = {
  type: 'hello';
};

export type AulaStateMessage = {
  type: 'state';
  lessonId: string;
  index: number;
  /** The current slide, so a late-joining `/tv` can catch up on its own. */
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
  | AulaWelcomeMessage;

export type AulaConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'closed'
  | 'offline';

export type AulaChannelHandlers = {
  /** Any message broadcast on the channel. */
  onMessage?: (message: AulaMessage) => void;
  /** Connection lifecycle. `offline` is emitted by the screens, not here. */
  onStatus?: (status: AulaConnectionStatus) => void;
  /** Fired on every successful subscribe, including reconnects. */
  onSubscribed?: () => void;
};

export type AulaChannel = {
  code: string;
  send: (message: AulaMessage) => void;
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

  const channel = client.channel(aulaChannelName(code));

  channel
    .on('broadcast', { event: AULA_EVENT }, ({ payload }) => {
      handlers.onMessage?.(payload as AulaMessage);
    })
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        handlers.onStatus?.('connected');
        handlers.onSubscribed?.();
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
    remove: () => {
      void client.removeChannel(channel);
    },
  };
}
