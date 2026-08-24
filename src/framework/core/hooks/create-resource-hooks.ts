import type { FieldValues } from "react-hook-form"
import type { ResourceConfig, ResourceId } from "../../types/resource-hook-types"
import { DEFAULT_SPLIT_CONFIG } from "../../types/split-config-type"
import { createActionsHook } from "./create-actions-hooks"
import { createAggregatesHook } from "./create-aggregates-hook"
import { createGroupAggregatesHook } from "./create-group-aggregates-hook"
import { createDetailHook } from "./create-detail-hook"
import { createFormHooks } from "./create-form-hooks"
import { createKeys, createListHook } from "./create-list-hooks"
import { createMutationsHook } from "./create-mutations-hook"
import { createTabsHook } from "./create-tabs-hooks"

export function createResourceHooks<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(config: ResourceConfig<TItem, TFormValues, TId>) {
  const {
    id,
    idField = "id",
    noun,
    routes,
    labels,
    isDeleteEligible,
    tabs = [],
    relations = [],
    openMode = "page",
    addMode = "page",
    splitConfig,
  } = config

  const resolvedSplitConfig = { ...DEFAULT_SPLIT_CONFIG, ...splitConfig }

  const keys = createKeys(config)
  const { useAddForm, useDetailForm, useDetailPageForm } = createFormHooks(
    config,
    keys
  )

  return {
    // Identity
    id,
    idField,
    keys,
    noun,
    routes,
    labels,
    tabs,
    relations,
    openMode,
    addMode,
    splitConfig: resolvedSplitConfig,
    isDeleteEligible,

    // Hooks
    useList: createListHook(config, keys),
    useAggregates: createAggregatesHook(config, keys),
    useGroupAggregates: createGroupAggregatesHook(config, keys),
    useDetail: createDetailHook(config, keys),
    useMutations: createMutationsHook(config, keys),
    useDetailTabs: createTabsHook(config),
    useActions: createActionsHook(config),
    useAddForm,
    useDetailForm,
    useDetailPageForm,

    actionForms: config.actionForms ?? [],
  }
}

export type ResourceHooks<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
> = ReturnType<typeof createResourceHooks<TItem, TFormValues, TId>>
