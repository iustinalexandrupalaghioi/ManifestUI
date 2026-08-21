"use client";

import { useEffect, useState, type Dispatch, type SetStateAction } from "react";

// Renders with `defaultValue` on the server/first paint, then hydrates from
// localStorage client-side — avoids SSR/hydration mismatches. `hydrated` is
// state (not a ref) so the persist effect only ever fires with the freshly
// read value, never overwriting storage with the pre-hydration default.
export function usePersistedState<T>(
  storageKey: string,
  defaultValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    try {
      const stored = window.localStorage.getItem(storageKey);
      setValue(stored !== null ? (JSON.parse(stored) as T) : defaultValue);
    } catch {
      setValue(defaultValue);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(value));
    } catch {
      // storage unavailable (private mode, quota) — state still works in memory
    }
  }, [hydrated, storageKey, value]);

  return [value, setValue];
}
