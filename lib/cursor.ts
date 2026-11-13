import { readStorage, writeStorage } from './storage';

export const CURSOR_STORAGE = 'show-cursor';

export function isCursorVisible(): boolean {
  return readStorage(CURSOR_STORAGE) === '1';
}

export function applyCursorVisibility(visible: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('hide-cursor', !visible);
}

export function setCursorVisible(visible: boolean): void {
  writeStorage(CURSOR_STORAGE, visible ? '1' : '0');
  applyCursorVisibility(visible);
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent<boolean>('supp:cursor', { detail: visible }));
  }
}
