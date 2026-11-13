import type { ColumnDef, Table } from "@tanstack/react-table"
import type { GroupableColumn, GroupByRule } from "./grouping"

export function buildGroupableColumns<TData>(
  table: Table<TData>
): GroupableColumn[] {
  return table
    .getAllLeafColumns()
    .filter(
      (col) =>
        col.columnDef.meta?.columnType &&
        col.columnDef.meta?.groupable !== false
    )
    .map((col) => ({
      id: col.id,
      name: col.columnDef.meta?.columnLabel ?? col.id,
      dbName: col.columnDef.meta?.columnName ?? col.id,
      type: col.columnDef.meta!.columnType!,
      origin: col.columnDef.meta?.origin,
    }))
}

// Seeds a default view's grouping from ColumnConfig.defaultGroupBy — runs on
// raw column defs, before a Table instance exists. Columns are ordered
// ascending by defaultGroupBy (outermost level first).
export function buildDefaultGrouping(
  columns: ColumnDef<any, any>[]
): GroupByRule[] {
  const entries: { order: number; rule: GroupByRule }[] = []
  for (const col of columns) {
    const meta = col.meta
    if (meta?.defaultGroupBy == null || !meta?.columnType || !col.id) continue
    entries.push({
      order: meta.defaultGroupBy,
      rule: {
        columnId: col.id,
        columnName: meta.columnName ?? col.id,
        columnLabel: meta.columnLabel ?? col.id,
        columnType: meta.columnType,
        ...(meta.origin ? { origin: meta.origin } : {}),
      },
    })
  }
  return entries.sort((a, b) => a.order - b.order).map((e) => e.rule)
}
