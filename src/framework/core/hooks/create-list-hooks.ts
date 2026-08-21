import { useInfiniteTable } from "@/framework/hooks/useInfiniteQuery";
import { unwrapAction } from "@/framework/lib/actionResult";

import type { FieldValues } from "react-hook-form";
import type {
  ResourceConfig,
  ResourceId,
} from "../../types/resource-hook-types";
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "@/framework/components/data-view/features/filtering";
import type { AggregateRule } from "@/framework/components/data-view/features/aggregates/aggregates";
import type { GroupByRule } from "@/framework/components/data-view/features/grouping/grouping";

export function createListHook<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  config: ResourceConfig<TItem, TFormValues, TId>,
  keys: ReturnType<typeof createKeys<TItem, TFormValues, TId>>,
) {
  const { fetchList, pageSize = 50 } = config;

  return function useList(
    sorting: SortRule[],
    filters: FilterRule[],
    groupBy: GroupByRule[],
    enabled?: boolean,
  ) {
    return useInfiniteTable<TItem>({
      queryKey: keys.list(sorting, filters, groupBy),
      pageSize,
      enabled,
      fetchPage: (cursor) =>
        fetchList(sorting, filters, cursor, groupBy).then(unwrapAction),
    });
  };
}

export function createKeys<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(config: ResourceConfig<TItem, TFormValues, TId>) {
  const { queryKey } = config;
  return {
    all: queryKey,
    list: (sorting: SortRule[], filters: FilterRule[], groupBy: GroupByRule[]) =>
      [...queryKey, "list", sorting, filters, groupBy] as const,
    detail: (id: ResourceId) => [...queryKey, "detail", String(id)] as const,
    aggregates: (rules: AggregateRule[], filters: FilterRule[]) =>
      [...queryKey, "aggregates", rules, filters] as const,
    groupAggregates: (
      rules: AggregateRule[],
      filters: FilterRule[],
      groupBy: GroupByRule[],
    ) => [...queryKey, "groupAggregates", rules, filters, groupBy] as const,
  };
}
