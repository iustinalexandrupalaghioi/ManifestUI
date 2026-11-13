"use client";

import { useEffect, useState } from "react";

export function useAvailableHeight(
  ref: React.RefObject<HTMLElement | null>,
  deps: readonly unknown[] = [],
): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    function measure() {
      if (!ref.current) return;
      const { top } = ref.current.getBoundingClientRect();
      const viewportHeight = document.documentElement.clientHeight;
      const next = Math.floor(
        Math.min(viewportHeight - top - 16, viewportHeight),
      );
      setHeight((prev) => (Math.abs(prev - next) < 1 ? prev : next));
    }

    measure();
    window.addEventListener("resize", measure);

    window.visualViewport?.addEventListener("resize", measure);

    const ro = new ResizeObserver(measure);
    if (ref.current) {
      for (
        let el: HTMLElement | null = ref.current;
        el;
        el = el.parentElement
      ) {
        ro.observe(el);
        for (
          let sib: Element | null = el.previousElementSibling;
          sib;
          sib = sib.previousElementSibling
        ) {
          ro.observe(sib);
        }
      }
    } else {
      ro.observe(document.documentElement);
    }

    return () => {
      window.removeEventListener("resize", measure);
      window.visualViewport?.removeEventListener("resize", measure);
      ro.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ref, ...deps]);

  return height;
}
