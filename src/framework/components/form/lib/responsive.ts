import type { Breakpoint, Resp, ResponsiveObject } from "../types/layout-types";

/** Ordered smallest → largest. */
export const BREAKPOINT_ORDER: Breakpoint[] = ["base", "sm", "md", "lg", "xl"];

/**
 * Container-width thresholds in px. `sm/md/lg` match the thresholds the
 * legacy SectionRenderer already used (480/720/960).
 */
export const BREAKPOINT_MIN_WIDTH: Record<Exclude<Breakpoint, "base">, number> =
  { sm: 480, md: 720, lg: 960, xl: 1200 };

export function breakpointForWidth(width: number): Breakpoint {
  if (width >= BREAKPOINT_MIN_WIDTH.xl) return "xl";
  if (width >= BREAKPOINT_MIN_WIDTH.lg) return "lg";
  if (width >= BREAKPOINT_MIN_WIDTH.md) return "md";
  if (width >= BREAKPOINT_MIN_WIDTH.sm) return "sm";
  return "base";
}

export function breakpointIndex(bp: Breakpoint): number {
  return BREAKPOINT_ORDER.indexOf(bp);
}

export function isResponsiveObject<T>(
  value: Resp<T> | undefined,
): value is ResponsiveObject<T> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).every((k) => (BREAKPOINT_ORDER as string[]).includes(k))
  );
}

/**
 * Mobile-first resolution: returns the value of the largest breakpoint that
 * is ≤ `bp` and defined. Plain values are returned unchanged.
 */
export function resolveResp<T>(
  value: Resp<T> | undefined,
  bp: Breakpoint,
): T | undefined {
  if (value === undefined) return undefined;
  if (!isResponsiveObject(value)) return value as T;
  for (let i = breakpointIndex(bp); i >= 0; i--) {
    const v = value[BREAKPOINT_ORDER[i]];
    if (v !== undefined) return v;
  }
  return undefined;
}
