import type { AnyColumn, SQL } from "drizzle-orm";
import {
  and,
  asc,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  lt,
  lte,
  ne,
  notIlike,
  or,
  sql,
} from "drizzle-orm";
import type { Cursor } from "@/framework/types/pagination";
import type { SortRule } from "../../core/tanstack-augmentations";
import type { FilterRule } from "./filters";
import type { AggregateRule } from "../aggregates/aggregates";
import { aggregateResultKey } from "../aggregates/aggregates";
import type { GroupByRule } from "../grouping/grouping";
import { groupingFlagKey } from "../grouping/grouping";

export type FilterColumnMap = Record<string, AnyColumn>;

export function buildWhereConditions(
  filters: FilterRule[],
  columns: FilterColumnMap,
): SQL | undefined {
  const conditions: SQL[] = [];

  for (const filter of filters) {
    const { columnName, columnType, operator, value, origin } = filter;
    const key = origin ? `${origin}.${columnName}` : columnName;
    const col = columns[key];
    if (!col) continue;

    switch (operator) {
      case "contains":
        conditions.push(ilike(col, `%${value}%`));
        break;

      case "not_contains":
        conditions.push(notIlike(col, `%${value}%`));
        break;

      case "equals":
        if (columnType === "datetime" && typeof value === "string") {
          conditions.push(and(gte(col, value), lte(col, `${value}.999`))!);
        } else {
          conditions.push(eq(col, value));
        }
        break;

      case "not_equals":
        if (columnType === "datetime" && typeof value === "string") {
          conditions.push(or(lt(col, value), gt(col, `${value}.999`))!);
        } else {
          conditions.push(ne(col, value));
        }
        break;

      case "gt":
        conditions.push(
          gt(
            col,
            columnType === "datetime" && typeof value === "string"
              ? `${value}.999`
              : value,
          ),
        );
        break;

      case "gte":
        conditions.push(gte(col, value));
        break;

      case "lt":
        conditions.push(lt(col, value));
        break;

      case "lte":
        conditions.push(
          lte(
            col,
            columnType === "datetime" && typeof value === "string"
              ? `${value}.999`
              : value,
          ),
        );
        break;

      case "is_empty":
        conditions.push(
          columnType === "text" ? or(isNull(col), eq(col, ""))! : isNull(col),
        );
        break;

      case "is_not_empty":
        conditions.push(
          columnType === "text"
            ? and(isNotNull(col), ne(col, ""))!
            : isNotNull(col),
        );
        break;

      case "is_true":
        conditions.push(eq(col, true));
        break;

      case "is_false":
        conditions.push(eq(col, false));
        break;

      case "is_any_of": {
        const arr = (value as (string | number)[]).map((v) =>
          columnType === "number" ? Number(v) : v,
        );
        conditions.push(inArray(col, arr));
        break;
      }
    }
  }

  return conditions.length ? and(...conditions) : undefined;
}

// One raw SQL aggregate expression per rule, keyed by aggregateResultKey.
export function buildAggregateSelection(
  rules: AggregateRule[],
  columns: FilterColumnMap,
): Record<string, SQL<number | null>> {
  const selection: Record<string, SQL<number | null>> = {};

  for (const rule of rules) {
    const key = rule.origin
      ? `${rule.origin}.${rule.columnName}`
      : rule.columnName;
    const col = columns[key];
    if (!col) continue;

    const resultKey = aggregateResultKey(rule);
    switch (rule.fn) {
      case "sum":
        selection[resultKey] = sql<number | null>`sum(${col})`;
        break;
      case "avg":
        selection[resultKey] = sql<number | null>`avg(${col})`;
        break;
      case "min":
        selection[resultKey] = sql<number | null>`min(${col})`;
        break;
      case "max":
        selection[resultKey] = sql<number | null>`max(${col})`;
        break;
      case "count":
        selection[resultKey] = sql<number | null>`count(${col})`;
        break;
      case "count_distinct":
        selection[resultKey] = sql<number | null>`count(distinct ${col})`;
        break;
    }
  }

  return selection;
}

export interface GroupKeyColumn {
  key: string;
  columnId: string;
  column: AnyColumn;
}

export function resolveGroupKeyColumns(
  groupBy: GroupByRule[],
  columns: FilterColumnMap,
): GroupKeyColumn[] {
  const resolved: GroupKeyColumn[] = [];
  for (const rule of groupBy) {
    const key = rule.origin
      ? `${rule.origin}.${rule.columnName}`
      : rule.columnName;
    const column = columns[key];
    if (!column) continue;
    resolved.push({ key, columnId: rule.columnId, column });
  }
  return resolved;
}

// Selection for the per-group rollup aggregate query: each group key column
// (aliased by columnId, so a rollup row carries its own group path) plus its
// GROUPING() flag, alongside the existing aggregate expressions.
export function buildGroupedAggregateSelection(
  rules: AggregateRule[],
  groupKeyColumns: GroupKeyColumn[],
  columns: FilterColumnMap,
): Record<string, SQL<unknown>> {
  const selection: Record<string, SQL<unknown>> = {};
  for (const gc of groupKeyColumns) {
    selection[gc.columnId] = sql`${gc.column}`;
    selection[groupingFlagKey(gc.columnId)] =
      sql<number>`grouping(${gc.column})`;
  }
  Object.assign(selection, buildAggregateSelection(rules, columns));
  return selection;
}

export function buildRollupClause(groupKeyColumns: GroupKeyColumn[]): SQL {
  const cols = groupKeyColumns.map((gc) => sql`${gc.column}`);
  return sql`ROLLUP (${sql.join(cols, sql`, `)})`;
}

export interface SortColumn {
  key: string;
  column: AnyColumn;
  direction: "asc" | "desc";
}

export function resolveSortColumns(
  sorting: SortRule[],
  columns: FilterColumnMap,
  id: { key: string; column: AnyColumn },
): SortColumn[] {
  const sortColumns: SortColumn[] = [];
  const seen = new Set<string>();

  for (const sort of sorting) {
    const columnName = sort.columnName ?? sort.id;
    const key = sort.origin ? `${sort.origin}.${columnName}` : columnName;
    const column = columns[key];
    if (!column || seen.has(key)) continue;
    seen.add(key);
    sortColumns.push({ key, column, direction: sort.desc ? "desc" : "asc" });
  }

  if (!seen.has(id.key)) {
    sortColumns.push({ key: id.key, column: id.column, direction: "asc" });
  }

  return sortColumns;
}

export function buildOrderBy(sortColumns: SortColumn[]): SQL[] {
  return sortColumns.map((s) =>
    s.direction === "desc" ? desc(s.column) : asc(s.column),
  );
}

export function buildKeysetWhere(
  sortColumns: SortColumn[],
  cursor: Cursor | null | undefined,
): SQL | undefined {
  if (!cursor) return undefined;

  const clauses = sortColumns.map((current, i) => {
    const equalities = sortColumns
      .slice(0, i)
      .map((s) => eq(s.column, cursor[s.key]));
    const cmp =
      current.direction === "desc"
        ? lt(current.column, cursor[current.key])
        : gt(current.column, cursor[current.key]);
    return and(...equalities, cmp)!;
  });

  return or(...clauses);
}

function getNestedValue(row: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<any>((acc, part) => acc?.[part], row);
}

export function extractCursor(
  row: Record<string, unknown> | undefined,
  sortColumns: SortColumn[],
): Cursor | null {
  if (!row) return null;
  const cursor: Cursor = {};
  for (const s of sortColumns) cursor[s.key] = getNestedValue(row, s.key);
  return cursor;
}
