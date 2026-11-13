import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { FieldValues } from "react-hook-form";
import { unwrapAction } from "@/framework/lib/actionResult";
import type { createKeys } from "./create-list-hooks";
import type { ResourceConfig, ResourceId } from "../../types/resource-hook-types";

export function createDetailHook<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  config: ResourceConfig<TItem, TFormValues, TId>,
  keys: ReturnType<typeof createKeys<TItem, TFormValues, TId>>,
) {
  const { fetchDetail } = config;

  return function useDetail(id: TId | undefined) {
    return useQuery({
      queryKey: keys.detail(id!),
      queryFn: () => fetchDetail(id!).then(unwrapAction),
      enabled: !!id && id !== 0 && id !== "",
      placeholderData: keepPreviousData,
    });
  };
}
