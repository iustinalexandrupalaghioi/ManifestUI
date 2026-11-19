"use client";

import type { ReactNode } from "react";

/** Calls a live link's `useLiveNumber` hook (one component per link, so hooks stay in order). */
export function LiveNumber({
  use,
  children,
}: {
  use: () => number | undefined;
  children: (value: number | undefined) => ReactNode;
}) {
  return <>{children(use())}</>;
}

/** How a live number reads: large counts are capped. */
export const formatLiveNumber = (value: number) => (value > 500 ? "500+" : String(value));
