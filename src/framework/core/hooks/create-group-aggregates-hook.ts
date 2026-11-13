import { useQuery } from "@tanstack/react-query";
import { unwrapAction } from "@/framework/lib/actionResult";
import type { FieldValues } from "react-hook-form";
import type { ResourceConfig, ResourceId } from "../../types/resource-hook-types";
import type { AggregateRule } from "@/framework/components/data-view/features/aggregates/aggregates";
import type { FilterRule } from "@/framework/components/data-view/features/filtering";
import type { GroupByRule } from "@/framework/components/data-view/features/grouping/grouping";
import type { createKeys } from "./create-list-hooks";

// Per-group subtotals — a parallel query to useAggregates' grand-total row,
// independent of it (see fetchXGroupAggregates: it uses a GROUP BY ROLLUP,
// not the plain aggregate query used for the grand total).
export function createGroupAggregatesHook<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  config: ResourceConfig<TItem, TFormValues, TId>,
  keys: ReturnType<typeof createKeys<TItem, TFormValues, TId>>,
) {
  const { fetchGroupAggregates } = config;

  return function useGroupAggregates(
    rules: AggregateRule[] | undefined,
    filters: FilterRule[],
    groupBy: GroupByRule[],
  ) {
    const safeRules = rules ?? [];
    return useQuery({
      queryKey: keys.groupAggregates(safeRules, filters, groupBy),
      queryFn: () =>
        fetchGroupAggregates!(safeRules, filters, groupBy).then(unwrapAction),
      enabled:
        !!fetchGroupAggregates && safeRules.length > 0 && groupBy.length > 0,
    });
  };
}
