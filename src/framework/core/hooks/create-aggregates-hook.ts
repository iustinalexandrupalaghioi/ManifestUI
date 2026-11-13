import { useQuery } from "@tanstack/react-query";
import { unwrapAction } from "@/framework/lib/actionResult";
import type { FieldValues } from "react-hook-form";
import type { ResourceConfig, ResourceId } from "../../types/resource-hook-types";
import type { AggregateRule } from "@/framework/components/data-view/features/aggregates/aggregates";
import type { FilterRule } from "@/framework/components/data-view/features/filtering";
import type { createKeys } from "./create-list-hooks";

export function createAggregatesHook<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  config: ResourceConfig<TItem, TFormValues, TId>,
  keys: ReturnType<typeof createKeys<TItem, TFormValues, TId>>,
) {
  const { fetchAggregates } = config;

  return function useAggregates(
    rules: AggregateRule[] | undefined,
    filters: FilterRule[],
  ) {
    const safeRules = rules ?? [];
    return useQuery({
      queryKey: keys.aggregates(safeRules, filters),
      queryFn: () => fetchAggregates!(safeRules, filters).then(unwrapAction),
      enabled: !!fetchAggregates && safeRules.length > 0,
    });
  };
}
