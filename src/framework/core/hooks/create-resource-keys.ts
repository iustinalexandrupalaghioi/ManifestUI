import type { FieldValues } from "react-hook-form"
import type { ResourceConfig } from "../../types/resource-hook-types"
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations"
import type { FilterRule } from "@/framework/components/data-view/features/filtering"

export function createResourceKeys<
  TItem extends { id: number | string },
  TFormValues extends FieldValues,
>(config: ResourceConfig<TItem, TFormValues>) {
  const { queryKey } = config
  return {
    all: queryKey,
    list: (
      sorting: SortRule[],
      filters: FilterRule[],
      listFilter?: Record<string, unknown>
    ) => [...queryKey, "list", sorting, filters, listFilter] as const,
    detail: (id: number | string) => [...queryKey, "detail", id] as const,
  }
}

export type ResourceKeys<
  TItem extends { id: number | string },
  TFormValues extends FieldValues,
> = ReturnType<typeof createResourceKeys<TItem, TFormValues>>
