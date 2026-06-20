import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Map<string, Set<() => void>>();

function subscribe(key: string, onStoreChange: () => void) {
  const onStorage = (event: StorageEvent) => {
    if (event.key === key) onStoreChange();
  };
  window.addEventListener('storage', onStorage);

  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key)!.add(onStoreChange);

  return () => {
    window.removeEventListener('storage', onStorage);
    listeners.get(key)?.delete(onStoreChange);
  };
}

function writeLocalStorage(key: string, value: string) {
  localStorage.setItem(key, value);
  listeners.get(key)?.forEach(listener => listener());
}

/** Hydration-safe localStorage flag via useSyncExternalStore. */
export function useLocalStorageFlag(key: string, defaultValue = false) {
  const stored = useSyncExternalStore(
    onStoreChange => subscribe(key, onStoreChange),
    () => localStorage.getItem(key) === '1',
    () => defaultValue,
  );

  const setStored = useCallback(
    (next: boolean | ((prev: boolean) => boolean)) => {
      const current = localStorage.getItem(key) === '1';
      const resolved = typeof next === 'function' ? next(current) : next;
      writeLocalStorage(key, resolved ? '1' : '0');
    },
    [key],
  );

  return [stored, setStored] as const;
}

/** Hydration-safe localStorage number via useSyncExternalStore. */
export function useLocalStorageNumber(key: string, defaultValue = 0) {
  const stored = useSyncExternalStore(
    onStoreChange => subscribe(key, onStoreChange),
    () => Number(localStorage.getItem(key) ?? defaultValue),
    () => defaultValue,
  );

  const setStored = useCallback(
    (next: number | ((prev: number) => number)) => {
      const current = Number(localStorage.getItem(key) ?? defaultValue);
      const resolved = typeof next === 'function' ? next(current) : next;
      writeLocalStorage(key, String(resolved));
    },
    [key, defaultValue],
  );

  return [stored, setStored] as const;
}
