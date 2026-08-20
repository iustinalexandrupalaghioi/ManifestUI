import { CustomTableHead, CustomTableHeader, CustomTableRow } from "@/framework/components/ui/CustomTable"
import { cn } from "@/framework/lib/utils"
import type { SortingState } from "@tanstack/react-table"
import { flexRender } from "@tanstack/react-table"
import type { FilterRule } from "../../features/filtering/filters"
import type { AggregateFunction, AggregateRule } from "../../features/aggregates/aggregates"
import { useDataViewCore } from "../../core/stores/DataViewProvider"
import { DataTableHeaderDropdown } from "./DataTableHeaderDropdown"

interface DataViewHeaderProps {
  sorting: SortingState
  setSorting: (
    updater: SortingState | ((old: SortingState) => SortingState)
  ) => void
  preFilters: FilterRule[]
  onOpenFilter: (columnId?: string) => void
  aggregateRules?: AggregateRule[]
  onSetAggregate?: (columnId: string, fn: AggregateFunction | null) => void
}

export function DataTableHeader({
  sorting,
  setSorting,
  preFilters,
  onOpenFilter,
  aggregateRules = [],
  onSetAggregate,
}: DataViewHeaderProps) {
  const { table } = useDataViewCore()

  const lastLeafColumnId = table.getVisibleLeafColumns().at(-1)?.id
  const lockedColumnIds = new Set(preFilters.map((p) => p.columnId))

  const handleResizeStart = (
    e: React.MouseEvent | React.TouchEvent,
    header: any
  ) => {
    document.body.style.cursor = "col-resize"
    const onMouseUp = () => {
      document.body.style.cursor = ""
      window.removeEventListener("mouseup", onMouseUp)
      window.removeEventListener("touchend", onMouseUp)
    }
    window.addEventListener("mouseup", onMouseUp)
    window.addEventListener("touchend", onMouseUp)
    header.getResizeHandler()(e)
  }

  const handleResizeDoubleClick = () => {
    table.resetColumnSizing()
  }

  const handlePrimarySort = (columnId: string, desc: boolean) => {
    const meta = table.getColumn(columnId)?.columnDef.meta
    const origin = meta?.origin
    const columnName = meta?.columnName ?? columnId
    setSorting([{ id: columnId, desc, columnName, origin }])
  }

  const handleAlsoSort = (columnId: string, desc: boolean) => {
    const meta = table.getColumn(columnId)?.columnDef.meta
    const origin = meta?.origin
    const columnName = meta?.columnName ?? columnId
    const existing = sorting.filter((s) => s.id !== columnId)
    setSorting([...existing, { id: columnId, desc, columnName, origin }])
  }

  const handleClearSort = (columnId: string) => {
    setSorting(sorting.filter((s) => s.id !== columnId))
  }

  return (
    <CustomTableHeader className="top-0 z-10 bg-background">
      {table.getHeaderGroups().map((headerGroup) => (
        <CustomTableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const isLast = header.column.id === lastLeafColumnId
            const canSort = header.column.getCanSort()
            const canFilter = header.column.getCanFilter()
            const columnLabel =
              header.column.columnDef.meta?.columnLabel ?? header.column.id
            const columnId = header.column.id
            const columnType = header.column.columnDef.meta?.columnType ?? null
            const columnOrigin = header.column.columnDef.meta?.origin
            const selectOptions =
              header.column.columnDef.meta?.selectOptions ?? []
            const sortIndex = sorting.findIndex(
              (s) => s.id === header.column.id
            )
            const sortRule = sortIndex !== -1 ? sorting[sortIndex] : null
            const isPinned = header.column.getIsPinned()
            const isMultiSort = sorting.length > 1
            const activeAggregateFn =
              aggregateRules.find((r) => r.columnId === columnId)?.fn ?? null

            return (
              <CustomTableHead
                key={header.id}
                style={{
                  top: 0,
                  position: "sticky",
                  width: isLast
                    ? undefined
                    : `calc(var(--header-${header.id}-size) * 1px)`,
                  minWidth: isLast
                    ? undefined
                    : `calc(var(--header-${header.id}-size) * 1px)`,
                  maxWidth: isLast
                    ? undefined
                    : `calc(var(--header-${header.id}-size) * 1px)`,
                  left: isPinned ? header.column.getStart("left") : undefined,
                  zIndex: isPinned ? 30 : 20,
                }}
                className={cn(
                  "relative h-0 border-b px-3 text-xs font-medium",
                  "overflow-hidden bg-background whitespace-nowrap select-none",
                  !isLast && "border-r",
                  header.column.columnDef.meta?.className
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {typeof header.column.columnDef.header === "function" ? (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )
                  ) : (
                    <DataTableHeaderDropdown
                      columnType={columnType}
                      columnId={columnId}
                      selectOptions={selectOptions}
                      canSort={canSort}
                      sorting={sorting}
                      sortRule={sortRule}
                      sortIndex={sortIndex}
                      isMultiSort={isMultiSort}
                      onPrimarySort={handlePrimarySort}
                      onAlsoSort={handleAlsoSort}
                      onClearSort={handleClearSort}
                      columnLabel={columnLabel}
                      handleOpenFilterDrawer={(id) => onOpenFilter(id)}
                      locked={lockedColumnIds.has(columnId)}
                      canFilter={canFilter}
                      origin={columnOrigin}
                      onHide={() => header.column.toggleVisibility(false)}
                      onTogglePin={() => {
                        const isPinned = header.column.getIsPinned()
                        header.column.pin(isPinned ? false : "left")
                      }}
                      isPinned={!!header.column.getIsPinned()}
                      canHide={header.column.getCanHide()}
                      activeAggregateFn={activeAggregateFn}
                      onSetAggregate={onSetAggregate}
                    />
                  )}
                </div>

                {header.column.getCanResize() && (
                  <div
                    onMouseDown={(e) => handleResizeStart(e, header)}
                    onTouchStart={(e) => handleResizeStart(e, header)}
                    onDoubleClick={handleResizeDoubleClick}
                    className="absolute top-0 right-0 h-full w-1 cursor-col-resize bg-transparent"
                  />
                )}
              </CustomTableHead>
            )
          })}
        </CustomTableRow>
      ))}
    </CustomTableHeader>
  )
}
