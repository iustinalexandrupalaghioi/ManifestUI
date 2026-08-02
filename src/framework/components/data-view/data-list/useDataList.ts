import type { Table } from "@tanstack/react-table"
import { useMemo } from "react"
import { getViewsStore, useActiveListView } from "../features/views/views.store"
import type { ListViewRecord } from "../features/views/views.types"
import type { DataListFeatureApi } from "./DataList.contract"

const SYSTEM_COLUMNS = new Set(["select", "columns", "_buffer"])

/**
 * useList
 *
 * Derives the visible list columns from the active ListViewRecord.
 * Owns the same ordering + visibility + slice logic that previously
 * lived inline in DataTableContent.tsx.
 *
 * applyListColumns writes a draft patch to the views store so the
 * ListColumnManager can stage changes before the user commits them.
 */
export function useDataList<TData>(
  tableId: string,
  table: Table<TData>
): DataListFeatureApi {
  const activeListView = useActiveListView(tableId)
  // Read draft so list column changes feel instant
  const listDraft = getViewsStore(tableId)(
    (s) => s.listDraft as Partial<ListViewRecord> | null
  )
  const listColumnVisibility =
    listDraft?.listColumnVisibility ??
    activeListView?.listColumnVisibility ??
    {}
  const listColumnOrder =
    listDraft?.listColumnOrder ?? activeListView?.listColumnOrder ?? []

  const visibleListColumns = useMemo(() => {
    const allCols = table
      .getAllLeafColumns()
      .filter((c) => !SYSTEM_COLUMNS.has(c.id))

    const ordered =
      listColumnOrder.length > 0
        ? [
            ...listColumnOrder
              .map((id) => allCols.find((c) => c.id === id))
              .filter((c): c is NonNullable<typeof c> => c != null),
            ...allCols.filter((c) => !listColumnOrder.includes(c.id)),
          ]
        : allCols

    return ordered.filter((c) => listColumnVisibility[c.id] !== false)
  }, [table, listColumnOrder, listColumnVisibility])

  const applyListColumns = (
    visibility: Record<string, boolean>,
    order: string[]
  ) => {
    getViewsStore(tableId).getState().updateListDraft({
      listColumnVisibility: visibility,
      listColumnOrder: order,
    })
  }

  return {
    visibleListColumns,
    listColumnVisibility,
    listColumnOrder,
    applyListColumns,
  }
}
