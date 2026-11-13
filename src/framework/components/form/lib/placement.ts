import type { CSSProperties } from "react";
import type { Align, Breakpoint, Placement } from "../types/layout-types";
import { resolveResp } from "./responsive";

export type ParentInfo =
  | { kind: "root"; bp: Breakpoint }
  | {
      kind: "grid";
      bp: Breakpoint;
      /** Numeric column count when known (used to clamp `span`). */
      cols?: number;
    }
  | { kind: "flex"; bp: Breakpoint; direction: "row" | "column" };

const ALIGN: Record<Align, CSSProperties["alignSelf"]> = {
  start: "start",
  center: "center",
  end: "end",
  stretch: "stretch",
};

/** 1 spacing unit = 0.25rem (Tailwind's scale). */
export function gapValue(units: number | undefined, fallback: number): string {
  return `${(units ?? fallback) * 0.25}rem`;
}

/**
 * Turns a node's `Placement` into inline CSS for the frame that wraps it,
 * resolved for the parent's current breakpoint.
 *
 * Inline styles (not Tailwind classes) are used on purpose: Tailwind's JIT
 * can't see dynamically built class names, which is what capped the legacy
 * layout at 4 columns.
 */
export function placementStyle(
  p: Placement,
  parent: ParentInfo,
  isField: boolean,
): CSSProperties {
  const bp = parent.bp;
  const style: CSSProperties = {};

  const order = resolveResp(p.order, bp);
  if (order !== undefined) style.order = order;

  const alignSelf = resolveResp(p.alignSelf, bp);
  if (alignSelf) style.alignSelf = ALIGN[alignSelf];
  const zIndex = resolveResp(p.zIndex, bp);
  if (zIndex !== undefined) style.zIndex = zIndex;

  if (parent.kind === "grid") {
    const justifySelf = resolveResp(p.justifySelf, bp);
    if (justifySelf) style.justifySelf = ALIGN[justifySelf];

    if (p.area) {
      style.gridArea = p.area;
    } else {
      const span = resolveResp(p.span, bp);
      const colValue = resolveResp(p.col, bp);
      const col = colValue === "auto" ? undefined : colValue;
      const rowSpan = resolveResp(p.rowSpan, bp);
      const rowValue = resolveResp(p.row, bp);
      const row = rowValue === "auto" ? undefined : rowValue;

      const clampedSpan =
        span !== undefined && parent.cols
          ? Math.max(1, Math.min(span, parent.cols))
          : span;

      if (col !== undefined && clampedSpan !== undefined && clampedSpan > 1) {
        style.gridColumn = `${col} / span ${clampedSpan}`;
      } else if (col !== undefined) {
        style.gridColumn = `${col}`;
      } else if (clampedSpan !== undefined && clampedSpan > 1) {
        style.gridColumn = `span ${clampedSpan}`;
      }

      if (row !== undefined && rowSpan !== undefined && rowSpan > 1) {
        style.gridRow = `${row} / span ${rowSpan}`;
      } else if (row !== undefined) {
        style.gridRow = `${row}`;
      } else if (rowSpan !== undefined && rowSpan > 1) {
        style.gridRow = `span ${rowSpan}`;
      }
    }
  }

  if (parent.kind === "flex") {
    const grow = resolveResp(p.grow, bp);
    const basis = resolveResp(p.basis, bp);
    if (grow !== undefined) style.flexGrow = grow;
    if (basis !== undefined)
      style.flexBasis = typeof basis === "number" ? `${basis}px` : basis;

    // In a horizontal row, fields share the width equally unless told
    // otherwise; non-field nodes (buttons, text) keep their natural size.
    if (
      parent.direction === "row" &&
      isField &&
      grow === undefined &&
      basis === undefined
    ) {
      style.flex = "1 1 0%";
    }
  }

  return { ...style, ...p.style };
}
