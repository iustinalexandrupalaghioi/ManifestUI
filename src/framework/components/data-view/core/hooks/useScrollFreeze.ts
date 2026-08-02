"use client";

import { useCallback, useEffect, useRef } from "react";

/**
 * Freezes the scroll position of the container while `isResizing` is true.
 * Returns a stable `onScroll` handler to attach to the scroll container.
 */
export function useScrollFreeze(
  scrollContainerRef: React.RefObject<HTMLDivElement | null>,
  isResizing: boolean,
): () => void {
  const frozenScrollTop = useRef<number | null>(null);
  const prevIsResizing = useRef(false);

  useEffect(() => {
    if (isResizing && !prevIsResizing.current) {
      frozenScrollTop.current = scrollContainerRef.current?.scrollTop ?? 0;
    }
    if (!isResizing && prevIsResizing.current) {
      frozenScrollTop.current = null;
    }
    prevIsResizing.current = isResizing;
  }, [isResizing, scrollContainerRef]);

  const handleScroll = useCallback(() => {
    if (frozenScrollTop.current !== null && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = frozenScrollTop.current;
    }
  }, [scrollContainerRef]);

  return handleScroll;
}
