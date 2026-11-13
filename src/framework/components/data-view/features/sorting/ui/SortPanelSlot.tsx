"use client"

import { useMemo } from "react"
import type { SortingState } from "@tanstack/react-table"
import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import {
  getViewsStore,
  useActiveListView,
  useActiveTableView,
} from "../../views/views.store"
import { getSortingStore } from "../sorting.store"
import { buildSortableColumns } from "../useSortableColumns"
import { SortPanel } from "./SortPanel"

/**
 * SortPanelSlot
 *
 * Registered as sortingFeature.Panel. Resolves tableId/mode/viewId itself.
 */
export function SortPanelSlot() {
  const { table, tableId } = useDataViewCore()
  const activeMode = useActiveMode(tableId)
  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)
  const viewId = activeMode === "list" ? activeListView.id : activeTableView.id
  const store = getSortingStore(tableId, viewId)
  const panelOpen = store((s) => s.panelOpen)
  const sorting = table.getState().sorting
  const sortableColumns = useMemo(() => buildSortableColumns(table), [table])

  const setSorting = (next: SortingState) => {
    store.getState().setSorting(next)
    if (activeMode === "list") {
      getViewsStore(tableId).getState().updateListDraft({ sorting: next })
    } else {
      getViewsStore(tableId).getState().updateTableDraft({ sorting: next })
    }
  }

  return (
    <SortPanel
      open={panelOpen}
      onOpenChange={(open) =>
        open ? store.getState().openPanel() : store.getState().closePanel()
      }
      initialSorting={sorting}
      sortableColumns={sortableColumns}
      onApply={setSorting}
    />
  )
}
