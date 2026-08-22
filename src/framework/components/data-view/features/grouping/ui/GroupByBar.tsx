"use client"

import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import { useActiveListView, useActiveTableView } from "../../views/views.store"
import { getGroupingStore } from "../grouping.store"
import { ExpandCollapseAllButton } from "./ExpandCollapseAllButton"
import { GroupByButton } from "./GroupByButton"

/**
 * GroupByBar
 *
 * Self-contained group-by button (+ expand/collapse-all when grouped).
 * Resolves tableId/mode/viewId itself, mirroring ViewBar's pattern.
 */
export function GroupByBar() {
  const { table, tableId } = useDataViewCore()
  const activeMode = useActiveMode(tableId)
  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)
  const viewId = activeMode === "list" ? activeListView.id : activeTableView.id
  const store = getGroupingStore(tableId, viewId)
  const grouping = store((s) => s.grouping)

  return (
    <>
      <GroupByButton
        grouping={grouping}
        onOpen={() => store.getState().openPanel()}
      />
      {grouping.length > 0 && <ExpandCollapseAllButton table={table} />}
    </>
  )
}
