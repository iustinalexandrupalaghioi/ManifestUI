import type { Row } from "@tanstack/react-table";
import type { ColumnType } from "../filtering/filters";
import type { SortRule } from "../../core/tanstack-augmentations";
import type { AggregateRule } from "../aggregates/aggregates";
import { aggregateResultKey } from "../aggregates/aggregates";

export function countLeafRows<TData>(row: Row<TData>): number {
  return row.getLeafRows().filter((r) => !r.getIsGrouped()).length;
}

export interface GroupByRule {
  columnId: string;
  columnName: string;
  columnLabel: string;
  columnType: ColumnType;
  origin?: string;
  showTotals?: boolean;
  // Per-level totals — independent of the table's own Totals (Σ) rules,
  // so a group can show e.g. avg(price) without that also landing in the
  // whole-table grand-total footer.
  aggregates?: AggregateRule[];
}

// The rollup query computes every level's aggregates in one pass, so the
// backend needs the deduped union across all levels' rule lists.
export function unionGroupAggregateRules(groupBy: GroupByRule[]): AggregateRule[] {
  const byKey = new Map<string, AggregateRule>();
  for (const level of groupBy) {
    for (const rule of level.aggregates ?? []) {
      byKey.set(aggregateResultKey(rule), rule);
    }
  }
  return [...byKey.values()];
}

export interface GroupableColumn {
  id: string;
  name: string;
  dbName: string;
  type: ColumnType;
  origin?: string;
}

export type GroupAggregateRow = Record<string, unknown>;

export function groupingFlagKey(columnId: string): string {
  return `__grouping_${columnId}`;
}

function pathKey(path: { columnId: string; value: unknown }[]): string {
  return path.map((p) => `${p.columnId}=${String(p.value)}`).join("|");
}

// Builds columnId -> value path for a rollup row, stopping at the first
// rolled-up (GROUPING = 1) level — the levels below it carry no real value.
function rowPath(
  row: GroupAggregateRow,
  groupBy: GroupByRule[],
): { columnId: string; value: unknown }[] | null {
  const path: { columnId: string; value: unknown }[] = [];
  for (const rule of groupBy) {
    const flag = row[groupingFlagKey(rule.columnId)];
    if (flag === 1 || flag === "1") break;
    path.push({ columnId: rule.columnId, value: row[rule.columnId] });
  }
  return path.length ? path : null;
}

// Maps each group's path (its chain of level values) to the rollup row
// carrying that group's subtotal — computed once per fetch, not per render.
export function buildGroupAggregateLookup(
  rows: GroupAggregateRow[],
  groupBy: GroupByRule[],
): Map<string, GroupAggregateRow> {
  const lookup = new Map<string, GroupAggregateRow>();
  for (const row of rows) {
    const path = rowPath(row, groupBy);
    if (!path) continue;
    lookup.set(pathKey(path), row);
  }
  return lookup;
}

export function lookupGroupAggregate(
  lookup: Map<string, GroupAggregateRow>,
  path: { columnId: string; value: unknown }[],
): GroupAggregateRow | undefined {
  return lookup.get(pathKey(path));
}

export function buildGroupingSortRules(rules: GroupByRule[]): SortRule[] {
  return rules.map((rule) => ({
    id: rule.columnId,
    desc: false,
    columnName: rule.columnName,
    ...(rule.origin ? { origin: rule.origin } : {}),
  }));
}
