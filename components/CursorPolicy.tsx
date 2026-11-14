'use client';

import { useEffect } from 'react';

/**
 * Keeps the mouse pointer visible everywhere. The only caret allowed is the
 * text insertion caret inside real typing fields; clicking anywhere else blurs
 * a stale focused input so it cannot keep blinking over a game/slide.
 */
export default function CursorPolicy() {
  useEffect(() => {
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const active = document.activeElement;
      if (active instanceof HTMLElement) active.blur();
    };

    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, []);

  return null;
}
