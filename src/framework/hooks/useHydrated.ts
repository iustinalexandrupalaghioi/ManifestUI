"use client";

import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False on the server and while React hydrates, true right after. For UI that
 * depends on browser-only state (the permission cache is filled on the
 * client): render it as the server did until hydration is done, so the first
 * paint always matches the server HTML, then show it.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
