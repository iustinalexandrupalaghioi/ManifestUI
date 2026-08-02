"use client"

import type { Table, SortingState } from "@tanstack/react-table"
import { useEffect } from "react"
import { getSortingStore } from "./sorting.store"
import type { SortingFeatureApi } from "./sorting.contract"

/**
 * useSorting
 *
 * Reads sort state from the per-viewId SortingStore and wires it into the
 * TanStack table instance. When the active view changes, the caller supplies
 * a new viewId and the table immediately reflects that view's sort state.
 *
 * Returns SortingFeatureApi so DataViewHeader can read sorting and call
 * setSorting without knowing about the store directly.
 */
export function useSorting<TData>(
  tableId: string,
  viewId: string,
  table: Table<TData>
): SortingFeatureApi {
  const store = getSortingStore(tableId, viewId)
  const sorting = store((s) => s.sorting)
  const rawSetSorting = store((s) => s.setSorting)
  const setSorting = (
    updater: SortingState | ((old: SortingState) => SortingState)
  ) => {
    const next =
      typeof updater === "function"
        ? updater(store.getState().sorting)
        : updater
    rawSetSorting(next)
  }

  // Keep TanStack table in sync whenever sort state changes
  useEffect(() => {
    table.setSorting(sorting)
  }, [sorting])

  return { sorting, setSorting }
}
