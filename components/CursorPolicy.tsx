'use client';

import { useEffect } from 'react';
import { applyCursorVisibility, isCursorVisible, setCursorVisible } from '@/lib/cursor';

/**
 * Hides the mouse pointer across the app by default, keeping it only on typing
 * fields (see the `.hide-cursor` rules in globals.css). `Ctrl+Alt+C` toggles it.
 */
export default function CursorPolicy() {
  useEffect(() => {
    applyCursorVisibility(isCursorVisible());

    const onToggle = (event: Event) => {
      const detail = (event as CustomEvent<boolean>).detail;
      if (typeof detail === 'boolean') applyCursorVisibility(detail);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.altKey && event.key.toLowerCase() === 'c') {
        event.preventDefault();
        setCursorVisible(!isCursorVisible());
      }
    };

    window.addEventListener('supp:cursor', onToggle);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('supp:cursor', onToggle);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  return null;
}
