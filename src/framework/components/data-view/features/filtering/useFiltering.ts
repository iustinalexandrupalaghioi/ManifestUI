"use client"

import type { Table } from "@tanstack/react-table"
import { useEffect, useRef } from "react"
import { getFilteringStore } from "./filtering.store"
import { getViewsStore } from "../views/views.store"
import type { FilterRule, FilterableColumn } from "./filters"

/**
 * useCellContextMenuFilter
 *
 * Registers the datatable:apply-filter event listener once at DataView level.
 * Always reads the current active viewId at event time so it targets the
 * correct filtering store regardless of when the event fires.
 */
export function useCellContextMenuFilter(
  tableId: string,
  getActiveViewId: () => string,
  getIsTableView: (viewId: string) => boolean
) {
  const getActiveViewIdRef = useRef(getActiveViewId)
  const getIsTableViewRef = useRef(getIsTableView)
  getActiveViewIdRef.current = getActiveViewId
  getIsTableViewRef.current = getIsTableView

  useEffect(() => {
    const handler = (e: Event) => {
      const { rule } = (e as CustomEvent<{ rule: FilterRule }>).detail
      const viewId = getActiveViewIdRef.current()
      const filterStore = getFilteringStore(tableId, viewId)
      const current = filterStore.getState().rules
      const next = current.some((f) => f.columnId === rule.columnId)
        ? current.map((f) => (f.columnId === rule.columnId ? rule : f))
        : [...current, rule]
      filterStore.getState().setRules(next)

      // Mark as draft
      const viewsStore = getViewsStore(tableId)
      if (getIsTableViewRef.current(viewId)) {
        viewsStore.getState().updateTableDraft({ filters: next })
      } else {
        viewsStore.getState().updateListDraft({ filters: next })
      }
    }

    window.addEventListener(`datatable:apply-filter:${tableId}`, handler)
    return () =>
      window.removeEventListener(`datatable:apply-filter:${tableId}`, handler)
  }, [tableId])
}

export function buildFilterableColumns<TData>(
  table: Table<TData>
): FilterableColumn[] {
  return table
    .getAllLeafColumns()
    .filter((col) => col.getCanFilter() && col.columnDef.meta?.columnType)
    .map((col) => ({
      id: col.id,
      name: col.columnDef.meta?.columnLabel ?? col.id,
      dbName: col.columnDef.meta?.columnName ?? col.id,
      type: col.columnDef.meta!.columnType!,
      selectOptions: col.columnDef.meta?.selectOptions,
      origin: col.columnDef.meta?.origin,
    }))
}
