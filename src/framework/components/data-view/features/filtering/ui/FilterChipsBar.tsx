"use client"

import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import { getSelectionStore } from "../../selection"
import {
  getViewsStore,
  useActiveListView,
  useActiveTableView,
} from "../../views/views.store"
import type { FilterRule } from "../filters"
import { getFilteringStore } from "../filtering.store"
import { FilterChips } from "./FilterChips"

/**
 * FilterChipsBar
 *
 * Self-contained filter-chips row, rendered separately from FilterBar's
 * button (it lives on its own row below, not inline with the toolbar
 * buttons — moving it into row 2 would be a visible layout change).
 */
export function FilterChipsBar() {
  const { tableId } = useDataViewCore()
  const activeMode = useActiveMode(tableId)
  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)
  const viewId = activeMode === "list" ? activeListView.id : activeTableView.id
  const store = getFilteringStore(tableId, viewId)
  const rules = store((s) => s.rules)

  if (rules.length === 0) return null

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
    <div className="mb-2">
      <FilterChips
        filters={rules}
        onRemove={(columnId) =>
          setRules(rules.filter((r) => r.columnId !== columnId))
        }
        onClearAll={() => setRules([])}
        onOpenFilter={(columnId) => store.getState().openPanel(columnId)}
      />
    </div>
  )
}
