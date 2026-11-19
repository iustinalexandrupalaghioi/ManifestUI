"use client";

import { CustomTableCell, CustomTableRow } from "@/framework/components/ui/CustomTable";
import { cn } from "@/framework/lib/utils";
import { flexRender, type Cell, type Row, type Table } from "@tanstack/react-table";
import { memo, useRef, type ReactNode } from "react";
import { pinnedLeftOffset } from "../../core/pinnedOffset";

interface DataTableRowProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
  virtualRowIndex: number;
  lastColumnId: string | undefined;
  pinnedLeftIds: string[];
  activeRowId: string | undefined;
  alternateRowColor: boolean;
  rowSelection: Record<string, boolean>;
  isCellSelected: (rowId: string, columnId: string) => boolean;
  isCellEditing: (rowId: string, columnId: string) => boolean;
  onRowClick?: (e: React.MouseEvent, row: Row<TData>) => void;
  onRowDoubleClick?: (row: Row<TData>) => void;
  onRowContextClick: (row: Row<TData>) => void;
  onCellClick: (e: React.MouseEvent, cell: Cell<TData, unknown>) => void;
  onCellDoubleClick?: (cell: Cell<TData, unknown>) => boolean;
  onCellContextClick: (cell: Cell<TData, unknown>) => void;
  onCellContextMenu: (
    e: React.MouseEvent,
    cell: Cell<TData, unknown>,
    effectiveRows: Row<TData>[],
  ) => void;
  measureRef: (node: HTMLTableRowElement | null) => void;
}

function DataTableRowInner<TData>({
  row,
  table,
  virtualRowIndex,
  lastColumnId,
  pinnedLeftIds,
  activeRowId,
  alternateRowColor,
  rowSelection,
  isCellSelected,
  isCellEditing,
  onRowClick,
  onRowDoubleClick,
  onRowContextClick,
  onCellClick,
  onCellDoubleClick,
  onCellContextClick,
  onCellContextMenu,
  measureRef,
}: DataTableRowProps<TData>) {
  const isGroupHeader = row.getIsGrouped();
  const lastClickRef = useRef<{ rowId: string; time: number } | null>(null);

  return (
    <CustomTableRow
      data-index={virtualRowIndex}
      ref={measureRef}
      className={cn(
        "select-none data-[state=selected]:bg-selected",
        isGroupHeader
          ? "bg-muted/40"
          : alternateRowColor && virtualRowIndex % 2 === 0 && "bg-muted/60",
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
        const editing = !isGroupHeader && isCellEditing(row.id, cell.column.id);

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
              left: isPinned
                ? pinnedLeftOffset(pinnedLeftIds, cell.column.id)
                : undefined,
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
                : flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          </CustomTableCell>
        );
      })}
    </CustomTableRow>
  );
}

/** One grid row (or group header): cell clicks, double clicks, context menus and pinned cells. Memoized. */
export const DataTableRow = memo(DataTableRowInner) as <TData>(
  props: DataTableRowProps<TData>,
) => ReactNode;
