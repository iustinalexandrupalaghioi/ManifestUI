import { CustomTable } from "@/framework/components/ui/CustomTable"
import React from "react"
import type {
  SortingState,
  Table as TTable,
  VisibilityState,
} from "@tanstack/react-table"

import type { FilterRule } from "../features/filtering/filters"
import type {
  AggregateFunction,
  AggregateResult,
  AggregateRule,
} from "../features/aggregates/aggregates"
import { DataTableHeader } from "./ui/DataTableHeader"
import { DataTableBody } from "./ui/DataTableBody"
import { DataTableFooter } from "./ui/DataTableFooter"

interface DataTableProps {
  table: TTable<any>
  isLoading: boolean
  rowSelection: Record<string, boolean>
  activeRowId?: string
  openOnRowClick?: boolean
  columnVisibility: VisibilityState
  columnSizing: Record<string, number>
  columnOrder: string[]
  columnPinning: { left: string[] }
  columnSizeVars: Record<string, number>
  sorting: SortingState
  setSorting: (
    updater: SortingState | ((old: SortingState) => SortingState)
  ) => void
  preFilters: FilterRule[]
  onOpenFilter: (columnId?: string) => void
  aggregateRules?: AggregateRule[]
  aggregateValues?: AggregateResult
  isAggregatesFetching?: boolean
  onSetAggregate?: (columnId: string, fn: AggregateFunction | null) => void
}

export function DataTable({
  table,
  isLoading,
  rowSelection,
  activeRowId,
  openOnRowClick,
  columnVisibility,
  columnSizing,
  columnOrder,
  columnPinning,
  columnSizeVars,
  sorting,
  setSorting,
  preFilters,
  onOpenFilter,
  aggregateRules = [],
  aggregateValues,
  isAggregatesFetching,
  onSetAggregate,
}: DataTableProps) {
  const leafColumns = table.getVisibleLeafColumns()
  const lastLeafColumnId = leafColumns.at(-1)?.id
  const fixedColumnsWidth = leafColumns
    .slice(0, -1)
    .reduce((sum, col) => sum + col.getSize(), 0)

  return (
    <div style={columnSizeVars as React.CSSProperties}>
      <CustomTable
        style={{ minWidth: fixedColumnsWidth }}
        className="w-full table-fixed border-separate border-spacing-0"
      >
        <colgroup>
          {leafColumns.map((col) => (
            <col
              key={col.id}
              style={{
                width:
                  col.id === lastLeafColumnId
                    ? undefined
                    : `calc(var(--col-${col.id}-size) * 1px)`,
                minWidth: `calc(var(--col-${col.id}-size) * 1px)`,
              }}
            />
          ))}
        </colgroup>
        <DataTableHeader
          sorting={sorting}
          setSorting={setSorting}
          preFilters={preFilters}
          onOpenFilter={onOpenFilter}
          aggregateRules={aggregateRules}
          onSetAggregate={onSetAggregate}
        />
        <DataTableBody
          columnSizing={columnSizing}
          rowSelection={rowSelection}
          activeRowId={activeRowId}
          openOnRowClick={openOnRowClick}
          isLoading={isLoading}
          columnOrder={columnOrder}
          columnPinning={columnPinning}
          columnVisibility={columnVisibility}
        />
        <DataTableFooter
          aggregateRules={aggregateRules}
          aggregateValues={aggregateValues}
          isAggregatesFetching={isAggregatesFetching}
        />
      </CustomTable>
    </div>
  )
}
