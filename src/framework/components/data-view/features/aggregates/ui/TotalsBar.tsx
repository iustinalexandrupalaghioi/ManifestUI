"use client"

import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import { useActiveListView, useActiveTableView } from "../../views/views.store"
import { getAggregatesStore } from "../aggregates.store"
import { TotalsButton } from "./TotalsButton"

/**
 * TotalsBar
 *
 * Self-contained totals-toggle button. Resolves tableId/mode/viewId itself
 * so it can be dropped inline in TableViewLayout/ListViewLayout without
 * prop threading, mirroring ViewBar's mode-resolution pattern.
 */
export function TotalsBar() {
  const { tableId } = useDataViewCore()
  const activeMode = useActiveMode(tableId)
  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)
  const viewId = activeMode === "list" ? activeListView.id : activeTableView.id
  const store = getAggregatesStore(tableId, viewId)
  const rules = store((s) => s.rules)

  return (
    <TotalsButton
      rules={rules}
      onOpen={() => store.getState().openPanel()}
    />
  )
}
