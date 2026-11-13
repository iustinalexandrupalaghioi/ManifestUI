"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Breakpoint } from "../types/layout-types";
import { breakpointForWidth } from "../lib/responsive";

// useLayoutEffect on the client so the first paint already uses the measured
// breakpoint; useEffect on the server where layout effects don't run.
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Measures the element the returned `ref` is attached to and returns the
 * matching breakpoint. Unlike `useContainerCols`, the thresholds are fixed
 * module constants, so the observer is created once per mount.
 */
export function useContainerBreakpoint<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const [bp, setBp] = useState<Breakpoint>("base");

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    setBp(breakpointForWidth(el.offsetWidth));

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setBp((prev) => {
        const next = breakpointForWidth(width);
        return prev === next ? prev : next;
      });
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return { ref, bp };
}
