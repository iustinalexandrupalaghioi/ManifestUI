import type { Row } from "@tanstack/react-table";
import type { GroupByRule } from "../../features/grouping/grouping";

/** What the grid body renders, in order: data rows and group headers, and each open group's totals row. */
export type DisplayItem<TData> =
  | { kind: "row"; row: Row<TData> }
  | { kind: "totals"; row: Row<TData> };

/** Rows plus a totals row after each expanded group (unless its level hides totals). */
export function buildDisplayItems<TData>(rows: Row<TData>[], grouping: Pick<GroupByRule, "showTotals">[]): DisplayItem<TData>[] {
  if (grouping.length === 0) {
    return rows.map((row) => ({ kind: "row" as const, row }));
  }
  const out: DisplayItem<TData>[] = [];
  const openGroups: Row<TData>[] = [];

  const flushTo = (depth: number) => {
    while (
      openGroups.length > 0 &&
      openGroups[openGroups.length - 1].depth >= depth
    ) {
      const group = openGroups.pop()!;
      const showTotals = grouping[group.depth]?.showTotals !== false;
      if (group.getIsExpanded() && showTotals) {
        out.push({ kind: "totals", row: group });
      }
    }
  };

  for (const row of rows) {
    flushTo(row.depth);
    out.push({ kind: "row", row });
    if (row.getIsGrouped()) openGroups.push(row);
  }
  flushTo(-Infinity);

  return out;
}
