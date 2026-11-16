"use client";

import { useEffect } from "react";

/** Adds `data-shown` to each reveal element the first time it scrolls into view. */
export function RevealObserver() {
  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-reveal], [data-reveal-group]");
    if (!("IntersectionObserver" in window)) {
      targets.forEach((el) => el.setAttribute("data-shown", ""));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.setAttribute("data-shown", "");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -60px 0px", threshold: 0.15 },
    );
    targets.forEach((el) => observer.observe(el));
    // Opt in to the hidden start state only once the observer is running.
    document.documentElement.setAttribute("data-reveal-ready", "");
    return () => observer.disconnect();
  }, []);
  return null;
}
