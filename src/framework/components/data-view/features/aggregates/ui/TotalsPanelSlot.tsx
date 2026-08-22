"use client"

import { useMemo } from "react"
import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import {
  getViewsStore,
  useActiveListView,
  useActiveTableView,
} from "../../views/views.store"
import { getAggregatesStore } from "../aggregates.store"
import { buildAggregatableColumns } from "../useAggregatableColumns"
import type { AggregateRule } from "../aggregates"
import { TotalsPanel } from "./TotalsPanel"

/**
 * TotalsPanelSlot
 *
 * Registered as aggregatesFeature.Panel. Resolves tableId/mode/viewId
 * itself, so it renders correctly regardless of which layout mounted it.
 */
export function TotalsPanelSlot() {
  const { table, tableId } = useDataViewCore()
  const activeMode = useActiveMode(tableId)
  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)
  const viewId = activeMode === "list" ? activeListView.id : activeTableView.id
  const store = getAggregatesStore(tableId, viewId)
  const rules = store((s) => s.rules)
  const panelOpen = store((s) => s.panelOpen)
  const focusColumnId = store((s) => s.focusColumnId)
  const aggregatableColumns = useMemo(
    () => buildAggregatableColumns(table),
    [table],
  )

  const setRules = (next: AggregateRule[]) => {
    store.getState().setRules(next)
    if (activeMode === "list") {
      getViewsStore(tableId).getState().updateListDraft({ aggregates: next })
    } else {
      getViewsStore(tableId).getState().updateTableDraft({ aggregates: next })
    }
  }

  return (
    <TotalsPanel
      open={panelOpen}
      onOpenChange={(open) =>
        open ? store.getState().openPanel() : store.getState().closePanel()
      }
      initialRules={rules}
      aggregatableColumns={aggregatableColumns}
      focusColumnId={focusColumnId}
      onApply={setRules}
    />
  )
}
