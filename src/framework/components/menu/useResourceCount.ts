"use client";

import { getResource } from "@/framework/registry/ResourceRegistry";
import { aggregateResultKey, type AggregateRule } from "@/framework/components/data-view/features/aggregates/aggregates";
import type { ColumnType, FilterOperator, FilterRule } from "@/framework/components/data-view/features/filtering/filters";

export interface CountFilter {
  columnName: string;
  columnType: ColumnType;
  operator: FilterOperator;
  value: FilterRule["value"];
}

const NO_FILTERS: CountFilter[] = [];

/** For a resource that isn't registered: no number. */
function useNoAggregates(..._args: unknown[]) {
  return { data: undefined };
}

/**
 * How many rows a registered resource has (optionally matching `filters`), for a
 * live menu link. It goes through the resource's own aggregates action, so it's
 * checked against the user's permissions (no permission: `undefined`) and
 * refreshed when the resource's rows change.
 */
export function useResourceCount(
  resourceId: string,
  filters: CountFilter[] = NO_FILTERS,
  idColumn = "id",
): number | undefined {
  // The registry doesn't change while the app runs, so this is the same hook on every render.
  const useAggregates = getResource(resourceId)?.hooks.useAggregates ?? useNoAggregates;
  const rule: AggregateRule = {
    columnId: idColumn,
    columnName: idColumn,
    columnLabel: idColumn,
    columnType: "number",
    fn: "count",
  };
  const { data } = useAggregates(
    [rule],
    filters.map((filter) => ({ ...filter, columnId: filter.columnName, columnLabel: filter.columnName })),
    // Without read permission the action refuses: no number, and no retries.
    { retry: false },
  );
  const value = data?.[aggregateResultKey(rule)];
  return typeof value === "number" ? value : value == null ? undefined : Number(value);
}
