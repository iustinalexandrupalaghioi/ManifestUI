import type { FieldValues } from "react-hook-form"
import type { ResourceConfig, ResourceId } from "../../types/resource-hook-types"
import { createActionsHook } from "./create-actions-hooks"
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
    afterAdd,
    afterUpdate,
  } = config

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
    isDeleteEligible,
    afterAdd,
    afterUpdate,

    // Hooks
    useList: createListHook(config, keys),
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
