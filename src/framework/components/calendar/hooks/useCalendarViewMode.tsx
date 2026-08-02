"use client";

import { useEffect, useState } from "react";
import type { CalendarMode } from "../types";

function readStoredMode(
  storageKey: string,
  allowedViews: CalendarMode[],
): CalendarMode | null {
  const stored = window.localStorage.getItem(storageKey) as CalendarMode | null;
  return stored && allowedViews.includes(stored) ? stored : null;
}

export function useCalendarViewMode(
  views: CalendarMode[],
  storageKey: string,
  initialMode: CalendarMode,
) {
  const fallbackMode = views.includes(initialMode) ? initialMode : views[0];

  const [mode, setModeState] = useState<CalendarMode>(fallbackMode);

  useEffect(() => {
    const stored = readStoredMode(storageKey, views);
    if (stored && stored !== mode) setModeState(stored);
  }, []);

  useEffect(() => {
    if (!views.includes(mode)) setModeState(fallbackMode);
  }, [views.join(",")]);

  const setMode = (next: CalendarMode) => {
    setModeState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(storageKey, next);
    }
  };

  return [mode, setMode] as const;
}
