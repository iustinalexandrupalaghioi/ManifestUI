"use client";

import { useEffect } from "react";

/** Set by `allowUnload()`: the page is about to reload on purpose (changes discarded). */
let unloadAllowed = false;

/** Lets the next reload or navigation happen without the "leave the page?" prompt. */
export function allowUnload() {
  unloadAllowed = true;
}

export function useBeforeUnloadWarning(shouldWarn: boolean) {
  useEffect(() => {
    if (!shouldWarn) return;

    const handler = (e: BeforeUnloadEvent) => {
      if (unloadAllowed) return;
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [shouldWarn]);
}
