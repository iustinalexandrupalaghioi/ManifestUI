"use client";

import { useEffect, useRef, useState } from "react";

export function useContainerCols(
  breakpoints: { minWidth: number; cols: number }[],
) {
  const ref = useRef<HTMLDivElement>(null);
  const [cols, setCols] = useState(1);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const sorted = [...breakpoints].sort((a, b) => b.minWidth - a.minWidth);

    const compute = (width: number) => {
      const match = sorted.find((bp) => width >= bp.minWidth);
      return match ? match.cols : 1;
    };

    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      setCols(compute(width));
    });

    observer.observe(el);
    setCols(compute(el.offsetWidth));

    return () => observer.disconnect();
  }, [breakpoints]);

  return { ref, cols };
}
