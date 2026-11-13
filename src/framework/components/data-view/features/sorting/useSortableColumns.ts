import type { Table } from "@tanstack/react-table"

export interface SortableColumn {
  id: string
  name: string
  dbName: string
  origin?: string
}

export function buildSortableColumns<TData>(
  table: Table<TData>
): SortableColumn[] {
  return table
    .getAllLeafColumns()
    .filter((col) => col.getCanSort() && col.columnDef.meta?.columnType)
    .map((col) => ({
      id: col.id,
      name: col.columnDef.meta?.columnLabel ?? col.id,
      dbName: col.columnDef.meta?.columnName ?? col.id,
      origin: col.columnDef.meta?.origin,
    }))
}
