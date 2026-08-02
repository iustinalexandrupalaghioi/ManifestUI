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
} from "drizzle-orm";
import type { Cursor } from "@/framework/types/pagination";
import type { SortRule } from "../../core/tanstack-augmentations";
import type { FilterRule } from "./filters";

/**
 * Maps each FilterRule/SortRule to a real SQL column. Key is `columnName`, or
 * `${origin}.${columnName}` for a column coming from a joined table - mirrors
 * the `origin` convention used by FilterRule/applyFilters. The same key must
 * also resolve (via dot-path) to that column's value in a query result row,
 * since it doubles as the keyset-cursor field name.
 */
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
          gt(col, columnType === "datetime" && typeof value === "string" ? `${value}.999` : value),
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
          lte(col, columnType === "datetime" && typeof value === "string" ? `${value}.999` : value),
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

export interface SortColumn {
  key: string;
  column: AnyColumn;
  direction: "asc" | "desc";
}

/**
 * Resolves SortRule[] into a concrete, ordered list of (column, direction)
 * pairs, always ending in `id` as a tiebreaker so the order is deterministic
 * - required for keyset pagination to work correctly. Callable on its own so
 * callers can inspect/reuse the resolved sort independently of building the
 * SQL ORDER BY or the pagination cursor.
 */
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
  return sortColumns.map((s) => (s.direction === "desc" ? desc(s.column) : asc(s.column)));
}

/**
 * Seek/keyset predicate equivalent to `sortColumns`' ORDER BY: rows strictly
 * after `cursor` in that order. Builds the standard cascading
 * `(a > cA) OR (a = cA AND b > cB) OR ...` form (per-column `>`/`<` matching
 * each column's own direction) rather than a row-value tuple comparison,
 * since tuple comparison only works when every column shares one direction.
 */
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

/** Builds the cursor for the *next* page from the last row of the current page. */
export function extractCursor(
  row: Record<string, unknown> | undefined,
  sortColumns: SortColumn[],
): Cursor | null {
  if (!row) return null;
  const cursor: Cursor = {};
  for (const s of sortColumns) cursor[s.key] = getNestedValue(row, s.key);
  return cursor;
}
