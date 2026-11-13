'use client';

import { useEffect, useRef, useState } from 'react';
import { greetingPeriod, pickGreeting } from '@/lib/greeting';

type GreetingProps = {
  /** Lesson happening right now, if any. Makes the greeting say "Boa aula". */
  currentLesson?: { title: string; turma: string } | null;
};

function formatToday(date: Date): string {
  const label = date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export default function Greeting({ currentLesson }: GreetingProps) {
  const [now, setNow] = useState<Date | null>(null);
  const [message, setMessage] = useState('');
  const periodRef = useRef<string | null>(null);
  const hasClass = Boolean(currentLesson);

  useEffect(() => {
    const tick = () => {
      const date = new Date();
      setNow(date);
      const next = greetingPeriod(date, hasClass);
      if (periodRef.current !== next) {
        periodRef.current = next;
        setMessage(pickGreeting(next));
      }
    };

    tick();
    const timer = window.setInterval(tick, 30_000);
    return () => window.clearInterval(timer);
  }, [hasClass]);

  if (!now) {
    /* Reserve the space so the page does not jump after hydration. */
    return <div className="h-[7.25rem]" aria-hidden="true" />;
  }

  return (
    <div className="min-w-0">
      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[var(--accent)]">
        Supp · Professor
      </p>
      <h1 className="mt-1 max-w-4xl text-3xl font-black tracking-tight text-balance sm:text-4xl">
        {message}
      </h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-[var(--muted)]">
        <span>{formatToday(now)}</span>
        {currentLesson ? (
          <>
            <span aria-hidden="true">·</span>
            <span className="inline-flex items-center rounded-full bg-[var(--accent)]/15 px-2.5 py-1 text-[11px] font-black uppercase tracking-wide text-[var(--accent)]">
              Aula agora
            </span>
            <span className="text-[var(--ink)]">{currentLesson.title}</span>
          </>
        ) : null}
      </p>
    </div>
  );
}
