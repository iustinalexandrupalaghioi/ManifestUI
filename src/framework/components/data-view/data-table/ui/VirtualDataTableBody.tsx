"use client";

import { TableBody, TableCell, TableRow } from "@/framework/components/ui/table";
import { cn } from "@/framework/lib/utils";
import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useEffect, useRef, type ReactNode } from "react";
import type { VirtualDataTableBodyProps } from "../../core/types";

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
        <TableRow key={rowIndex} className="odd:bg-muted/60">
          {Array.from({ length: columnsLength }).map((_, colIndex) => {
            const isLast = colIndex === columnsLength - 1;
            const colId = isLast ? lastColumnId : `col-${colIndex}`;

            return (
              <TableCell
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
              </TableCell>
            );
          })}
        </TableRow>
      ))}
    </>
  );
}

function VirtualTableBodyInner<TData>({
  rows,
  lastColumnId,
  columnsLength,
  scrollContainerRef,
  isResizing,
  onCellContextMenu,
  onRowClick,
  onRowDoubleClick,
  onRowContextClick,
  isLoading,
  rowSelection,
  isCellSelected,
  onCellClick,
  columnStateKey,
}: VirtualDataTableBodyProps<TData>) {
  const virtualizer = useVirtualizer({
    count: rows.length,
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

  const lastClickRef = useRef<{ rowId: string; time: number } | null>(null);

  if (isLoading) {
    return (
      <TableBody>
        <SkeletonRows
          columnsLength={columnsLength}
          lastColumnId={lastColumnId}
        />
      </TableBody>
    );
  }

  if (!rows.length) {
    return (
      <TableBody>
        <TableRow>
          <TableCell colSpan={columnsLength} className="h-24 text-center">
            No results.
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {paddingTop > 0 && (
        <TableRow>
          <TableCell
            colSpan={columnsLength}
            style={{ height: paddingTop, padding: 0, border: 0 }}
          />
        </TableRow>
      )}

      {virtualRows.map((virtualRow) => {
        const row = rows[virtualRow.index];

        return (
          <TableRow
            key={row.id}
            data-index={virtualRow.index}
            ref={(node) => {
              if (!isResizing && node && !node.dataset.measured) {
                node.dataset.measured = "true";
                virtualizer.measureElement(node);
              }
            }}
            className={cn(
              "select-none",
              virtualRow.index % 2 === 0 && "bg-muted/60",
            )}
            data-state={row.getIsSelected() ? "selected" : undefined}
            onClick={(e) => onRowClick?.(e, row)}
          >
            {row.getVisibleCells().map((cell) => {
              const isLast = cell.column.id === lastColumnId;
              const isPinned = cell.column.getIsPinned();

              return (
                <TableCell
                  key={cell.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onCellClick(e, cell);

                    const now = Date.now();
                    const last = lastClickRef.current;

                    if (last?.rowId === row.id && now - last.time < 300) {
                      onRowDoubleClick?.(row);
                      lastClickRef.current = null;
                    } else {
                      lastClickRef.current = { rowId: row.id, time: now };
                      onRowClick?.(e, row);
                    }
                  }}
                  onContextMenu={(e) => {
                    onCellClick(e, cell);
                    onRowContextClick(row);

                    const sel = rowSelection;
                    const isSelected = sel[row.id];
                    const selectedCount = Object.keys(sel).filter(
                      (id) => sel[id],
                    ).length;
                    const effectiveRows =
                      isSelected && selectedCount > 1
                        ? rows.filter((r) => sel[r.id])
                        : [row];

                    onCellContextMenu(e, cell, effectiveRows);
                  }}
                  style={{
                    position: isPinned ? "sticky" : undefined,
                    left: isPinned ? cell.column.getStart("left") : undefined,
                    zIndex: isPinned ? 20 : 0,
                  }}
                  className={cn(
                    "relative h-0 px-3 text-xs",
                    "truncate overflow-hidden border-b whitespace-nowrap",
                    !isLast && "border-r",
                    isPinned && "bg-background",
                    isCellSelected(row.id, cell.column.id) &&
                      "bg-primary/5 outline -outline-offset-1 outline-primary",
                    cell.column.columnDef.meta?.className,
                  )}
                >
                  <div className="min-w-0 truncate">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </div>
                </TableCell>
              );
            })}
          </TableRow>
        );
      })}

      {paddingBottom > 0 && (
        <TableRow>
          <TableCell
            colSpan={columnsLength}
            style={{ height: paddingBottom, padding: 0, border: 0 }}
          />
        </TableRow>
      )}
    </TableBody>
  );
}
export const VirtualDataTableBody = memo(VirtualTableBodyInner) as <TData>(
  props: VirtualDataTableBodyProps<TData>,
) => ReactNode;
