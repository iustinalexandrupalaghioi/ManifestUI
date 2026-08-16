"use client";

import {
  CustomTableBody,
  CustomTableCell,
  CustomTableRow,
} from "@/framework/components/ui/CustomTable";
import { cn } from "@/framework/lib/utils";
import { flexRender } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { memo, useEffect, useRef, type ReactNode } from "react";
import { useTranslations } from "next-intl";
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

function VirtualTableBodyInner<TData>({
  rows,
  lastColumnId,
  columnsLength,
  scrollContainerRef,
  isResizing,
  onCellContextMenu,
  onRowClick,
  onRowDoubleClick,
  onCellDoubleClick,
  onRowContextClick,
  isLoading,
  rowSelection,
  isCellSelected,
  isCellEditing,
  editingKey,
  onCellClick,
  onCellContextClick,
  columnStateKey,
}: VirtualDataTableBodyProps<TData>) {
  const t = useTranslations("DataView");
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
        const row = rows[virtualRow.index];

        return (
          <CustomTableRow
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
              const editing = isCellEditing(row.id, cell.column.id);

              return (
                <CustomTableCell
                  key={cell.id}
                  data-editing={editing || undefined}
                  onClick={(e) => {
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
                  }}
                  onContextMenu={(e) => {
                    onCellContextClick(cell);
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
                    "relative border-b text-xs",
                    editing
                      ? "overflow-hidden bg-background outline -outline-offset-1 outline-primary"
                      : "h-0 truncate overflow-hidden px-3 whitespace-nowrap",
                    !isLast && "border-r",
                    isPinned && "bg-background",
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
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
