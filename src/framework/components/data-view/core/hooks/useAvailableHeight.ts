"use client"

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
      const next = window.innerHeight - top - 16;
      // Split view nests two of these hooks (this element's own container,
      // plus an ancestor of it observed by another instance elsewhere) —
      // each one's height-driven layout change can retrigger the other's
      // ResizeObserver. Snapping sub-pixel differences to the previous
      // value (instead of always taking the newly-computed one) means
      // React's setState bails out on an unchanged primitive once things
      // settle, damping what would otherwise be an unbounded back-and-forth.
      setHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    }

    measure();
    window.addEventListener("resize", measure);

    // Collapsing a sibling above this element (e.g. a form panel) shifts its
    // top offset without changing the document's own box size, so <html>
    // alone never reports it — observe every ancestor up to <body> instead.
    const ro = new ResizeObserver(measure);
    if (ref.current) {
      for (let el: HTMLElement | null = ref.current; el; el = el.parentElement) {
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
