import { useInfiniteTable } from "@/framework/hooks/useInfiniteQuery"
import { unwrapAction } from "@/framework/lib/actionResult"

import type { FieldValues } from "react-hook-form"
import type { ResourceConfig, ResourceId } from "../../types/resource-hook-types"
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations"
import type { FilterRule } from "@/framework/components/data-view/features/filtering"

export function createListHook<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  config: ResourceConfig<TItem, TFormValues, TId>,
  keys: ReturnType<typeof createKeys<TItem, TFormValues, TId>>
) {
  const { fetchList, pageSize = 50 } = config

  return function useList(
    sorting: SortRule[],
    filters: FilterRule[],
    enabled?: boolean,
  ) {
    return useInfiniteTable<TItem>({
      queryKey: keys.list(sorting, filters),
      pageSize,
      enabled,
      fetchPage: (cursor) =>
        fetchList(sorting, filters, cursor).then(unwrapAction),
    })
  }
}

export function createKeys<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(config: ResourceConfig<TItem, TFormValues, TId>) {
  const { queryKey } = config
  return {
    all: queryKey,
    list: (sorting: SortRule[], filters: FilterRule[]) =>
      [...queryKey, "list", sorting, filters] as const,
    detail: (id: ResourceId) => [...queryKey, "detail", id] as const,
  }
}
