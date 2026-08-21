"use client";

import {
  CustomTableBody,
  CustomTableCell,
  CustomTableRow,
} from "@/framework/components/ui/CustomTable";
import { cn } from "@/framework/lib/utils";
import { flexRender, type Row } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useEffect, useMemo, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
import type { VirtualDataTableBodyProps } from "../../core/types";
import { DataTableGroupTotalsRow } from "./DataTableGroupTotalsRow";

const SKELETON_ROW_COUNT = 12;

function SkeletonRows({
  columnsLength,
  lastColumnId,
}: {
  columnsLength: number;
  lastColumnId: string | undefined;
}) {
  return (
    <>
      {Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
        <CustomTableRow key={rowIndex} className="odd:bg-muted/60">
          {Array.from({ length: columnsLength }).map((_, colIndex) => {
            const isLast = colIndex === columnsLength - 1;
            const colId = isLast ? lastColumnId : `col-${colIndex}`;

            return (
              <CustomTableCell
                key={colIndex}
                style={{
                  width: isLast
                    ? undefined
                    : `calc(var(--col-${colId}-size) * 1px)`,
                  minWidth: isLast
                    ? undefined
                    : `calc(var(--col-${colId}-size) * 1px)`,
                  maxWidth: isLast
                    ? undefined
                    : `calc(var(--col-${colId}-size) * 1px)`,
                }}
                className="relative h-0 border-r border-b px-3"
              >
                <div
                  className={cn(
                    "h-4 animate-pulse rounded-full bg-muted-foreground/15",
                    rowIndex % 3 === 0 && colIndex % 2 === 0 && "w-3/4",
                    rowIndex % 3 === 1 && colIndex % 2 === 0 && "w-1/2",
                    rowIndex % 3 === 2 && colIndex % 2 === 0 && "w-2/3",
                    colIndex % 2 !== 0 && "w-4/5",
                    colIndex === 0 && "-ms-2 w-3",
                    colIndex === 1 && "w-3",
                  )}
                />
              </CustomTableCell>
            );
          })}
        </CustomTableRow>
      ))}
    </>
  );
}

type DisplayItem<TData> =
  | { kind: "row"; row: Row<TData> }
  | { kind: "totals"; row: Row<TData> };

function VirtualTableBodyInner<TData>({
  rows,
  table,
  lastColumnId,
  columnsLength,
  grouping,
  groupAggregateRules,
  groupAggregateLookup,
  isGroupAggregatesFetching,
  scrollContainerRef,
  isResizing,
  onCellContextMenu,
  onRowClick,
  onRowDoubleClick,
  onCellDoubleClick,
  onRowContextClick,
  isLoading,
  rowSelection,
  activeRowId,
  isCellSelected,
  isCellEditing,
  editingKey,
  onCellClick,
  onCellContextClick,
  columnStateKey,
}: VirtualDataTableBodyProps<TData>) {
  const t = useTranslations("DataView");

  const displayItems = useMemo<DisplayItem<TData>[]>(() => {
    if (groupAggregateRules.length === 0) {
      return rows.map((row) => ({ kind: "row" as const, row }));
    }
    const out: DisplayItem<TData>[] = [];
    const openGroups: Row<TData>[] = [];

    const flushTo = (depth: number) => {
      while (
        openGroups.length > 0 &&
        openGroups[openGroups.length - 1].depth >= depth
      ) {
        const group = openGroups.pop()!;
        const showTotals = grouping[group.depth]?.showTotals !== false;
        if (group.getIsExpanded() && showTotals) {
          out.push({ kind: "totals", row: group });
        }
      }
    };

    for (const row of rows) {
      flushTo(row.depth);
      out.push({ kind: "row", row });
      if (row.getIsGrouped()) openGroups.push(row);
    }
    flushTo(-Infinity);

    return out;
  }, [rows, groupAggregateRules.length, grouping]);

  const virtualizer = useVirtualizer({
    count: displayItems.length,
    getScrollElement: () => scrollContainerRef.current,
    estimateSize: () => 33,
    overscan: isResizing ? 0 : 5,
  });

  const virtualRows = virtualizer.getVirtualItems();
  const totalHeight = virtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalHeight - virtualRows[virtualRows.length - 1].end
      : 0;

  useEffect(() => {
    virtualizer.measure();
  }, [columnStateKey]);

  useEffect(() => {
    virtualizer.measure();
  }, [editingKey]);

  const lastClickRef = useRef<{ rowId: string; time: number } | null>(null);

  if (isLoading) {
    return (
      <CustomTableBody>
        <SkeletonRows
          columnsLength={columnsLength}
          lastColumnId={lastColumnId}
        />
      </CustomTableBody>
    );
  }

  if (!rows.length) {
    return (
      <CustomTableBody>
        <CustomTableRow>
          <CustomTableCell colSpan={columnsLength} className="h-24 text-center">
            {t("noResults")}
          </CustomTableCell>
        </CustomTableRow>
      </CustomTableBody>
    );
  }

  return (
    <CustomTableBody>
      {paddingTop > 0 && (
        <CustomTableRow>
          <CustomTableCell
            colSpan={columnsLength}
            style={{ height: paddingTop, padding: 0, border: 0 }}
          />
        </CustomTableRow>
      )}

      {virtualRows.map((virtualRow) => {
        const item = displayItems[virtualRow.index];
        const measureRef = (node: HTMLTableRowElement | null) => {
          if (!isResizing && node && !node.dataset.measured) {
            node.dataset.measured = "true";
            virtualizer.measureElement(node);
          }
        };

        if (item.kind === "totals") {
          return (
            <DataTableGroupTotalsRow
              key={`${item.row.id}__totals`}
              row={item.row}
              table={table}
              groupAggregateRules={groupAggregateRules}
              groupAggregateLookup={groupAggregateLookup}
              isGroupAggregatesFetching={isGroupAggregatesFetching}
              dataIndex={virtualRow.index}
              measureRef={measureRef}
            />
          );
        }

        const row = item.row;
        const isGroupHeader = row.getIsGrouped();

        return (
          <CustomTableRow
            key={row.id}
            data-index={virtualRow.index}
            ref={measureRef}
            className={cn(
              "select-none",
              isGroupHeader
                ? "bg-muted/40"
                : virtualRow.index % 2 === 0 && "bg-muted/60",
              row.id === activeRowId && "bg-primary/5",
            )}
            data-state={row.getIsSelected() ? "selected" : undefined}
            onClick={(e) => {
              if (!isGroupHeader) onRowClick?.(e, row);
            }}
          >
            {row.getVisibleCells().map((cell) => {
              const isLast = cell.column.id === lastColumnId;
              const isPinned = cell.column.getIsPinned();
              const isGroupCell = cell.column.id === "group";
              const editing =
                !isGroupHeader && isCellEditing(row.id, cell.column.id);

              return (
                <CustomTableCell
                  key={cell.id}
                  data-editing={editing || undefined}
                  onClick={
                    isGroupHeader
                      ? undefined
                      : (e) => {
                          e.stopPropagation();
                          onCellClick(e, cell);

                          const now = Date.now();
                          const last = lastClickRef.current;

                          if (last?.rowId === row.id && now - last.time < 300) {
                            lastClickRef.current = null;
                            const handled = onCellDoubleClick?.(cell) ?? false;
                            if (!handled) onRowDoubleClick?.(row);
                          } else {
                            lastClickRef.current = { rowId: row.id, time: now };
                            onRowClick?.(e, row);
                          }
                        }
                  }
                  onContextMenu={
                    isGroupHeader
                      ? undefined
                      : (e) => {
                          onCellContextClick(cell);
                          onRowContextClick(row);

                          const sel = rowSelection;
                          const isSelected = sel[row.id];
                          const selectedCount = Object.keys(sel).filter(
                            (id) => sel[id],
                          ).length;
                          const effectiveRows =
                            isSelected && selectedCount > 1
                              ? table.getSelectedRowModel().rows
                              : [row];

                          onCellContextMenu(e, cell, effectiveRows);
                        }
                  }
                  style={{
                    position: isPinned ? "sticky" : undefined,
                    left: isPinned ? cell.column.getStart("left") : undefined,
                    zIndex: isPinned ? 20 : 0,
                    transform: isPinned ? "translateZ(0)" : undefined,
                  }}
                  className={cn(
                    "relative border-b text-xs",
                    editing
                      ? "overflow-hidden bg-background outline -outline-offset-1 outline-primary"
                      : "h-0 truncate overflow-hidden px-3 whitespace-nowrap",
                    !isLast && "border-r",
                    !isPinned && isGroupHeader && "bg-muted/40",
                    isPinned && (isGroupHeader ? "bg-muted" : "bg-background"),
                    !isGroupHeader &&
                      isCellSelected(row.id, cell.column.id) &&
                      "bg-primary/5 outline -outline-offset-1 outline-primary",
                    cell.column.columnDef.meta?.className,
                  )}
                >
                  <div
                    className={
                      editing
                        ? "flex h-full min-w-0 items-stretch"
                        : "min-w-0 truncate"
                    }
                  >
                    {isGroupHeader && !isGroupCell
                      ? null
                      : flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                  </div>
                </CustomTableCell>
              );
            })}
          </CustomTableRow>
        );
      })}

      {paddingBottom > 0 && (
        <CustomTableRow>
          <CustomTableCell
            colSpan={columnsLength}
            style={{ height: paddingBottom, padding: 0, border: 0 }}
          />
        </CustomTableRow>
      )}
    </CustomTableBody>
  );
}
export const VirtualDataTableBody = memo(VirtualTableBodyInner) as <TData>(
  props: VirtualDataTableBodyProps<TData>,
) => ReactNode;
