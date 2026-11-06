/**
 * localStorage helpers with a one-way migration from the old D20 Classroom
 * keys. Keeping the migration means returning teachers do not lose volume,
 * language or saved room settings after the Supp rebrand.
 */

const LEGACY_PREFIX = 'd20-classroom-';
const PREFIX = 'supp-';

export function storageKey(name: string): string {
  return `${PREFIX}${name}`;
}

function legacyKeyFor(name: string): string {
  return `${LEGACY_PREFIX}${name}`;
}

export function readStorage(name: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const value = window.localStorage.getItem(storageKey(name));
    if (value !== null) return value;

    const legacy = window.localStorage.getItem(legacyKeyFor(name));
    if (legacy === null) return null;

    window.localStorage.setItem(storageKey(name), legacy);
    window.localStorage.removeItem(legacyKeyFor(name));
    return legacy;
  } catch {
    return null;
  }
}

export function writeStorage(name: string, value: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.setItem(storageKey(name), value);
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
}

export function removeStorage(name: string): void {
  if (typeof window === 'undefined') return;

  try {
    window.localStorage.removeItem(storageKey(name));
    window.localStorage.removeItem(legacyKeyFor(name));
  } catch {
    // Storage can be unavailable in private or restricted browsing modes.
  }
}
