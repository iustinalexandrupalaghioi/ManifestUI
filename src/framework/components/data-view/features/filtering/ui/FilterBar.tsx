"use client"

import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import { useActiveListView, useActiveTableView } from "../../views/views.store"
import { getFilteringStore } from "../filtering.store"
import { FilterButton } from "./FilterButton"

/**
 * FilterBar
 *
 * Self-contained filter-toggle button. Resolves tableId/mode/viewId itself,
 * mirroring ViewBar's pattern. FilterChips render separately via
 * FilterChipsBar, in their own row below — see that file for why.
 */
export function FilterBar() {
  const { tableId } = useDataViewCore()
  const activeMode = useActiveMode(tableId)
  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)
  const viewId = activeMode === "list" ? activeListView.id : activeTableView.id

  return (
    <FilterButton
      viewId={viewId}
      tableId={tableId}
      onOpen={(columnId) => getFilteringStore(tableId, viewId).getState().openPanel(columnId)}
    />
  )
}
