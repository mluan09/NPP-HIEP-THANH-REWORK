import { useState } from 'react';

export function usePersistedState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw != null) return JSON.parse(raw) as T;
    } catch { /* ignore */ }
    return initialValue;
  });

  const set = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      try {
        window.localStorage.setItem(key, JSON.stringify(resolved));
      } catch { /* ignore */ }
      return resolved;
    });
  };

  const clear = () => {
    try { window.localStorage.removeItem(key); } catch { /* ignore */ }
    setValue(initialValue);
  };

  return [value, set, clear] as const;
}
