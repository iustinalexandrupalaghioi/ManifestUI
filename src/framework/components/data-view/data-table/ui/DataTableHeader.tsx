import {
  CustomTableHead,
  CustomTableHeader,
  CustomTableRow,
} from "@/framework/components/ui/CustomTable";
import { cn } from "@/framework/lib/utils";
import type { SortingState } from "@tanstack/react-table";
import { flexRender } from "@tanstack/react-table";
import { useCallback, useRef } from "react";
import type { FilterRule } from "../../features/filtering/filters";
import type {
  AggregateFunction,
  AggregateRule,
} from "../../features/aggregates/aggregates";
import { useDataViewCore } from "../../core/stores/DataViewProvider";
import { getCoreStore } from "../../core/stores/DataViewStore";
import { pinnedLeftOffset } from "../../core/pinnedOffset";
import { DataTableHeaderDropdown } from "./DataTableHeaderDropdown";

const DEFAULT_MIN_COLUMN_SIZE = 20;

interface DragState {
  columnId: string;
  startX: number;
  startSize: number;
  minSize: number;
  maxSize: number;
}

interface DataViewHeaderProps {
  sorting: SortingState;
  setSorting: (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => void;
  preFilters: FilterRule[];
  onOpenFilter: (columnId?: string) => void;
  aggregateRules?: AggregateRule[];
  onSetAggregate?: (columnId: string, fn: AggregateFunction | null) => void;
}

export function DataTableHeader({
  sorting,
  setSorting,
  preFilters,
  onOpenFilter,
  aggregateRules = [],
  onSetAggregate,
}: DataViewHeaderProps) {
  const { table, tableId, columnSizeVarsRef, featureIds } = useDataViewCore();
  const pinningEnabled = featureIds.has("pinning");
  const columnManagerEnabled = featureIds.has("columnManager");

  const lastLeafColumnId = table.getVisibleLeafColumns().at(-1)?.id;
  const lockedColumnIds = new Set(preFilters.map((p) => p.columnId));
  const pinnedLeftIds = table.getState().columnPinning.left ?? [];

  const dragStateRef = useRef<DragState | null>(null);

  const applySize = useCallback(
    (columnId: string, size: number) => {
      const node = columnSizeVarsRef.current;
      if (!node) return;
      node.style.setProperty(`--header-${columnId}-size`, String(size));
      node.style.setProperty(`--col-${columnId}-size`, String(size));
    },
    [columnSizeVarsRef],
  );

  const computeSize = (drag: DragState, clientX: number) =>
    Math.min(
      drag.maxSize,
      Math.max(drag.minSize, drag.startSize + (clientX - drag.startX)),
    );

  // Pointer capture (not window-level listeners) is what makes this
  // reliable when the drag crosses over a sticky/pinned cell: capturing on
  // the handle itself guarantees every subsequent pointermove/pointerup
  // routes here regardless of what's visually underneath the cursor.
  // Without it, the very first drag over a pinned column could pick up an
  // inconsistent clientX and commit a corrupted size on release.
  const handleResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, header: any) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      const column = header.column;
      dragStateRef.current = {
        columnId: column.id,
        startX: e.clientX,
        startSize: column.getSize(),
        minSize: column.columnDef.minSize ?? DEFAULT_MIN_COLUMN_SIZE,
        maxSize: column.columnDef.maxSize ?? Number.MAX_SAFE_INTEGER,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      getCoreStore(tableId).getState().setIsResizing(true);
    },
    [tableId],
  );

  const handleResizeMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      applySize(drag.columnId, computeSize(drag, e.clientX));
    },
    [applySize],
  );

  const handleResizeEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragStateRef.current;
      if (!drag) return;
      const finalSize = computeSize(drag, e.clientX);
      dragStateRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      getCoreStore(tableId).getState().setIsResizing(false);
      table.setColumnSizing((old) => ({ ...old, [drag.columnId]: finalSize }));
    },
    [tableId, table],
  );

  const handleResizeDoubleClick = () => {
    table.resetColumnSizing();
  };

  const handlePrimarySort = (columnId: string, desc: boolean) => {
    const meta = table.getColumn(columnId)?.columnDef.meta;
    const origin = meta?.origin;
    const columnName = meta?.columnName ?? columnId;
    setSorting([{ id: columnId, desc, columnName, origin }]);
  };

  const handleAlsoSort = (columnId: string, desc: boolean) => {
    const meta = table.getColumn(columnId)?.columnDef.meta;
    const origin = meta?.origin;
    const columnName = meta?.columnName ?? columnId;
    const existing = sorting.filter((s) => s.id !== columnId);
    setSorting([...existing, { id: columnId, desc, columnName, origin }]);
  };

  const handleClearSort = (columnId: string) => {
    setSorting(sorting.filter((s) => s.id !== columnId));
  };

  return (
    <CustomTableHeader className="top-0 z-10 bg-background">
      {table.getHeaderGroups().map((headerGroup) => (
        <CustomTableRow key={headerGroup.id}>
          {headerGroup.headers.map((header) => {
            const isLast = header.column.id === lastLeafColumnId;
            const canSort = header.column.getCanSort();
            const canFilter = header.column.getCanFilter();
            const columnLabel =
              header.column.columnDef.meta?.columnLabel ?? header.column.id;
            const columnId = header.column.id;
            const columnType = header.column.columnDef.meta?.columnType ?? null;
            const columnOrigin = header.column.columnDef.meta?.origin;
            const selectOptions =
              header.column.columnDef.meta?.selectOptions ?? [];
            const sortIndex = sorting.findIndex(
              (s) => s.id === header.column.id,
            );
            const sortRule = sortIndex !== -1 ? sorting[sortIndex] : null;
            const isPinned = header.column.getIsPinned();
            const isMultiSort = sorting.length > 1;
            const activeAggregateFn =
              aggregateRules.find((r) => r.columnId === columnId)?.fn ?? null;

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
                  left: isPinned
                    ? pinnedLeftOffset(pinnedLeftIds, columnId)
                    : undefined,
                  zIndex: isPinned ? 30 : 20,
                  transform: "translateZ(0)",
                }}
                className={cn(
                  "relative h-10 border-b px-3 text-xs font-medium",
                  "overflow-hidden bg-background whitespace-nowrap select-none",
                  !isLast && "border-r",
                  header.column.columnDef.meta?.className,
                )}
              >
                <div className="flex min-w-0 items-center gap-2">
                  {typeof header.column.columnDef.header === "function" ? (
                    flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
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
                      onHide={
                        columnManagerEnabled
                          ? () => header.column.toggleVisibility(false)
                          : undefined
                      }
                      onTogglePin={
                        pinningEnabled
                          ? () => {
                              const isPinned = header.column.getIsPinned();
                              header.column.pin(isPinned ? false : "left");
                            }
                          : undefined
                      }
                      isPinned={pinningEnabled && !!header.column.getIsPinned()}
                      canHide={
                        columnManagerEnabled && header.column.getCanHide()
                      }
                      activeAggregateFn={activeAggregateFn}
                      onSetAggregate={onSetAggregate}
                    />
                  )}
                </div>

                {header.column.getCanResize() && (
                  <div
                    onPointerDown={(e) => handleResizeStart(e, header)}
                    onPointerMove={handleResizeMove}
                    onPointerUp={handleResizeEnd}
                    onPointerCancel={handleResizeEnd}
                    onDoubleClick={handleResizeDoubleClick}
                    className="absolute top-0 right-0 h-full w-1 touch-none cursor-col-resize bg-transparent"
                  />
                )}
              </CustomTableHead>
            );
          })}
        </CustomTableRow>
      ))}
    </CustomTableHeader>
  );
}
