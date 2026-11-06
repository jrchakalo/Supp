'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Language } from '@/lib/i18n';

type VolumeControlProps = {
  volume: number;
  muted: boolean;
  uiLanguage: Language;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
};

export default function VolumeControl({
  volume,
  muted,
  uiLanguage,
  onVolumeChange,
  onToggleMute,
}: VolumeControlProps) {
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sliderId = useId();
  const percent = Math.round(volume * 100);
  const Icon = muted ? VolumeX : Volume2;

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={uiLanguage === 'pt' ? 'Configurações de áudio' : 'Audio settings'}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        className={cn(
          'flex h-10 items-center gap-1.5 rounded-xl border-2 border-[var(--line)] bg-[var(--surface-2)] px-2.5 text-xs font-black uppercase text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]',
          isOpen && 'border-[var(--accent)]'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden="true" />
        <span className="hidden sm:inline">
          {muted
            ? uiLanguage === 'pt'
              ? 'Mudo'
              : 'Muted'
            : uiLanguage === 'pt'
              ? 'Som'
              : 'Sound'}
        </span>
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={uiLanguage === 'pt' ? 'Configurações de áudio' : 'Audio settings'}
          className="fixed inset-x-3 bottom-4 z-50 rounded-2xl border-2 border-[var(--line)] bg-[var(--surface)] p-4 shadow-[var(--panel-shadow)] md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-[calc(100%+8px)] md:w-64"
        >
          <div className="flex items-center justify-between gap-3">
            <label
              htmlFor={sliderId}
              className="text-[11px] font-black uppercase tracking-[0.14em] text-[var(--muted)]"
            >
              {uiLanguage === 'pt' ? 'Volume' : 'Volume'}
            </label>
            <span className="text-xs font-black text-[var(--ink)]">{percent}%</span>
          </div>

          <input
            id={sliderId}
            type="range"
            min={0}
            max={100}
            step={1}
            value={percent}
            onChange={(event) => onVolumeChange(Number(event.target.value) / 100)}
            aria-valuetext={`${percent}%`}
            className="mt-3 h-2 w-full cursor-pointer accent-[var(--accent)]"
          />

          <button
            type="button"
            onClick={onToggleMute}
            className="mt-4 flex h-9 w-full items-center justify-center gap-2 rounded-lg border-2 border-[var(--line)] bg-[var(--surface-2)] text-[11px] font-black uppercase tracking-wide text-[var(--ink)] transition hover:brightness-105 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
          >
            {muted ? (
              <Volume2 className="h-4 w-4" aria-hidden="true" />
            ) : (
              <VolumeX className="h-4 w-4" aria-hidden="true" />
            )}
            {muted
              ? uiLanguage === 'pt'
                ? 'Ativar som'
                : 'Unmute'
              : uiLanguage === 'pt'
                ? 'Silenciar'
                : 'Mute'}
          </button>

          <p className="mt-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
            {uiLanguage === 'pt' ? 'Música e efeitos sonoros' : 'Music and sound effects'}
          </p>
        </div>
      )}
    </div>
  );
}
