import type { FieldValues } from "react-hook-form"
import type { ResourceComponentsConfig } from "../../types/resource-components-types"
import type { ResourceId } from "../../types/resource-hook-types"
import type { FieldTabConfig } from "../../types/tab-config-type"
import { createAddPage } from "./create-add-page"
import { createDetailDialog } from "./create-detail-dialog"
import { createDetailPage } from "./create-detail-page"
import { createLookupDialog } from "./create-lookup-dialog"
import { createOverview } from "./create-overview"
import type { ResourceHooks } from "../hooks/create-resource-hooks"
import { createAddDialog } from "./create-add-dialog"

export function createResourceComponents<
  TItem,
  TFormValues extends FieldValues,
  TId extends ResourceId = number,
>(
  hooks: ResourceHooks<TItem, TFormValues, TId>,
  config: ResourceComponentsConfig<TItem, TFormValues>,
  addTabs: FieldTabConfig<TFormValues>[] = []
) {
  const AddDialog = createAddDialog(hooks, config, addTabs)
  const DetailDialog = createDetailDialog(hooks, config)
  const AddPage = createAddPage(hooks, config, addTabs)
  const DetailPage = createDetailPage(hooks, config)
  const LookupDialog = createLookupDialog(hooks, config)
  const Overview = createOverview(hooks, config, AddDialog, DetailDialog, DetailPage)

  return {
    Overview,
    AddDialog,
    DetailDialog,
    AddPage,
    DetailPage,
    LookupDialog,
  }
}
