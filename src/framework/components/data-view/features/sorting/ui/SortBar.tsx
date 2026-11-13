"use client"

import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import { useActiveListView, useActiveTableView } from "../../views/views.store"
import { getSortingStore } from "../sorting.store"
import { SortButton } from "./SortButton"

/**
 * SortBar
 *
 * Self-contained sort-toggle button. Resolves tableId/mode/viewId itself,
 * mirroring ViewBar's pattern.
 */
export function SortBar() {
  const { table, tableId } = useDataViewCore()
  const activeMode = useActiveMode(tableId)
  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)
  const viewId = activeMode === "list" ? activeListView.id : activeTableView.id
  const sorting = table.getState().sorting

  return (
    <SortButton
      sorting={sorting}
      onOpen={() => getSortingStore(tableId, viewId).getState().openPanel()}
    />
  )
}
