"use client"

import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useDataViewFilter } from "../../../core/stores/DataViewFilterContext"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import { getSelectionStore } from "../../selection"
import {
  getViewsStore,
  useActiveListView,
  useActiveTableView,
} from "../../views/views.store"
import type { FilterRule } from "../filters"
import { getFilteringStore } from "../filtering.store"
import { FilterPanel } from "./FilterPanel"

/**
 * FilterPanelSlot
 *
 * Registered as filteringFeature.Panel. Resolves tableId/mode/viewId
 * itself; enrichedPreFilters/filterableColumns come from
 * DataViewFilterContext, since those are computed once in DataViewLayout
 * and can't be derived from the table instance alone.
 */
export function FilterPanelSlot() {
  const { tableId } = useDataViewCore()
  const { enrichedPreFilters, filterableColumns } = useDataViewFilter()
  const activeMode = useActiveMode(tableId)
  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)
  const viewId = activeMode === "list" ? activeListView.id : activeTableView.id
  const store = getFilteringStore(tableId, viewId)
  const rules = store((s) => s.rules)
  const panelOpen = store((s) => s.panelOpen)
  const focusColumnId = store((s) => s.focusColumnId)

  const setRules = (next: FilterRule[]) => {
    store.getState().setRules(next)
    if (activeMode === "list") {
      getViewsStore(tableId).getState().updateListDraft({ filters: next })
    } else {
      getViewsStore(tableId).getState().updateTableDraft({ filters: next })
    }
    getSelectionStore(tableId).getState().setRowSelection({})
  }

  return (
    <FilterPanel
      open={panelOpen}
      onOpenChange={(open) =>
        open ? store.getState().openPanel() : store.getState().closePanel()
      }
      initialFilters={rules}
      filterableColumns={filterableColumns}
      focusColumnId={focusColumnId}
      onApply={setRules}
      staticFilters={enrichedPreFilters}
    />
  )
}
