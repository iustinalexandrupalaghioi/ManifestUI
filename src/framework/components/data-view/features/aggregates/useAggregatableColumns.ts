import type { ColumnDef, Table } from "@tanstack/react-table"
import type { AggregatableColumn, AggregateRule } from "./aggregates"

export function buildAggregatableColumns<TData>(
  table: Table<TData>
): AggregatableColumn[] {
  return table
    .getAllLeafColumns()
    .filter(
      (col) =>
        col.columnDef.meta?.columnType &&
        col.columnDef.meta?.aggregatable !== false
    )
    .map((col) => ({
      id: col.id,
      name: col.columnDef.meta?.columnLabel ?? col.id,
      dbName: col.columnDef.meta?.columnName ?? col.id,
      type: col.columnDef.meta!.columnType!,
      origin: col.columnDef.meta?.origin,
    }))
}

// Seeds a default view's aggregates from ColumnConfig.defaultAggregate —
// runs on raw column defs, before a Table instance exists.
export function buildDefaultAggregateRules(
  columns: ColumnDef<any, any>[]
): AggregateRule[] {
  const rules: AggregateRule[] = []
  for (const col of columns) {
    const meta = col.meta
    if (!meta?.defaultAggregate || !meta?.columnType || !col.id) continue
    rules.push({
      columnId: col.id,
      columnName: meta.columnName ?? col.id,
      columnLabel: meta.columnLabel ?? col.id,
      columnType: meta.columnType,
      fn: meta.defaultAggregate,
      ...(meta.origin ? { origin: meta.origin } : {}),
    })
  }
  return rules
}
