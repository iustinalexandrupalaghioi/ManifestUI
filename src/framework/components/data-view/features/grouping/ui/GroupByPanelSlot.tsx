"use client"

import { useMemo } from "react"
import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import { buildAggregatableColumns } from "../../aggregates/useAggregatableColumns"
import {
  getViewsStore,
  useActiveListView,
  useActiveTableView,
} from "../../views/views.store"
import type { GroupByRule } from "../grouping"
import { getGroupingStore } from "../grouping.store"
import { buildGroupableColumns } from "../useGroupableColumns"
import { GroupByPanel } from "./GroupByPanel"

/**
 * GroupByPanelSlot
 *
 * Registered as groupingFeature.Panel. Resolves tableId/mode/viewId itself.
 */
export function GroupByPanelSlot() {
  const { table, tableId } = useDataViewCore()
  const activeMode = useActiveMode(tableId)
  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)
  const viewId = activeMode === "list" ? activeListView.id : activeTableView.id
  const store = getGroupingStore(tableId, viewId)
  const grouping = store((s) => s.grouping)
  const panelOpen = store((s) => s.panelOpen)
  const groupableColumns = useMemo(() => buildGroupableColumns(table), [table])
  const aggregatableColumns = useMemo(
    () => buildAggregatableColumns(table),
    [table],
  )

  const setGrouping = (next: GroupByRule[]) => {
    store.getState().setGrouping(next)
    if (activeMode === "list") {
      getViewsStore(tableId).getState().updateListDraft({ grouping: next })
    } else {
      getViewsStore(tableId).getState().updateTableDraft({ grouping: next })
    }
  }

  return (
    <GroupByPanel
      open={panelOpen}
      onOpenChange={(open) =>
        open ? store.getState().openPanel() : store.getState().closePanel()
      }
      initialGrouping={grouping}
      groupableColumns={groupableColumns}
      aggregatableColumns={aggregatableColumns}
      onApply={setGrouping}
    />
  )
}
