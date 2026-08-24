import type { FieldValues } from "react-hook-form";

import type { DefinedResourceConfig } from "../types/define-resource-type";
import type { ResourceConfig, ResourceId } from "../types/resource-hook-types";
import { createResourceHooks } from "./hooks/create-resource-hooks";

// Flattens the author-facing, grouped `DefinedResourceConfig` into the
// internal flat `ResourceConfig` shape `createResourceHooks` (and its
// per-concern `create-*` sub-factories, which each independently re-read
// fields off this same flat object) expect. Mirrors the reshaping
// `defineResourceComponents` already does for the components side —
// grouping the authoring surface doesn't need to ripple into the factory
// layer, only into this translation step.
function toResourceConfig<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  config: DefinedResourceConfig<TItem, TFormValues, TId>,
): ResourceConfig<TItem, TFormValues, TId> {
  const { descriptor, idField, presentation, data, form, detail, actions } =
    config;

  return {
    id: descriptor.id,
    idField,
    queryKey: descriptor.queryKey,
    schema: form.schema,
    emptyValues: form.emptyValues,
    noun: descriptor.noun,
    routes: descriptor.routes,
    labels: descriptor,
    openMode: presentation?.open,
    addMode: presentation?.add,
    splitConfig: presentation?.split,
    fetchList: data.fetchList,
    pageSize: data.pageSize,
    fetchAggregates: data.fetchAggregates,
    fetchGroupAggregates: data.fetchGroupAggregates,
    isDeleteEligible: actions?.isDeleteEligible,
    getRowUrl: actions?.getRowUrl,
    bulkActions: actions?.bulk,
    fetchDetail: data.fetchDetail,
    mutationFns: data.mutations,
    // Read for cache invalidation on mutate (create-mutations-hook.ts), not
    // just tab rendering — kept flowing through even though it's authored
    // under `detail`.
    tabs: detail?.tabs,
    relations: detail?.relations,
    defaultTab: detail?.defaultTab,
    defaultFormOpen: detail?.defaultFormOpen,
    addTabs: form.addTabs,
    actionForms: actions?.forms,
  };
}

export function defineResourceHooks<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(config: DefinedResourceConfig<TItem, TFormValues, TId>) {
  const hooks = createResourceHooks(toResourceConfig(config));
  return { hooks, config };
}
