"use client";

import { useEffect, useState } from "react";

/**
 * Measures the available vertical space from the top of the referenced element
 * to the bottom of the viewport. Re-measures on window resize and DOM changes.
 */
export function useAvailableHeight(
  ref: React.RefObject<HTMLElement | null>,
): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    function measure() {
      if (!ref.current) return;
      const top = ref.current.getBoundingClientRect().top;
      const next = Math.min(window.innerHeight - top - 16, window.innerHeight);
      setHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    }

    measure();
    window.addEventListener("resize", measure);

    const ro = new ResizeObserver(measure);
    if (ref.current) {
      for (
        let el: HTMLElement | null = ref.current;
        el;
        el = el.parentElement
      ) {
        ro.observe(el);
      }
    } else {
      ro.observe(document.documentElement);
    }

    return () => {
      window.removeEventListener("resize", measure);
      ro.disconnect();
    };
  }, [ref]);

  return height;
}
