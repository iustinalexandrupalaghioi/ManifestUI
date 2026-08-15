"use client";

import {
  formatDate,
  formatDateTime,
} from "@/framework/lib/date-time-formatters";
import type { Cell, Table } from "@tanstack/react-table";
import { useCallback, useEffect, useRef, useState } from "react";

export type CellAddress = { rowId: string; columnId: string };

// Columns excluded from copy/TSV export (still by name — these are data-less)
const EXCLUDED_COLUMNS = ["select", "columns"];
const EXCLUDED_COLUMN_SET = new Set(EXCLUDED_COLUMNS);

const cellKey = (rowId: string, columnId: string) => `${rowId}::${columnId}`;

function cellValue<TData>(cell: Cell<TData, unknown>): string {
  const v = cell.getValue();
  const type = cell.column.columnDef.meta?.columnType;
  const selectOptions = cell.column.columnDef.meta?.selectOptions;

  if (v == null) return "";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  if (type === "date" && typeof v === "string") return formatDate(v);
  if (type === "datetime" && typeof v === "string") return formatDateTime(v);
  if (type === "select" && typeof v === "string" && selectOptions) {
    const match = selectOptions.find((o) => o.value === v);
    return match ? match.label : v;
  }

  return String(v);
}

export function useCellSelection<TData>(
  table: Table<TData>,
  rowSelection: Record<string, boolean>,
) {
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const anchorRef = useRef<CellAddress | null>(null);
  const tableRef = useRef(table);
  tableRef.current = table;

  // ── Clear when row selection resets (after action) ──
  useEffect(() => {
    if (Object.keys(rowSelection).length === 0) clearSelection();
  }, [rowSelection]);

  const isActionColumn = useCallback((columnId: string): boolean => {
    return EXCLUDED_COLUMN_SET.has(columnId);
  }, []);

  const getSelectionTsv = useCallback((): string => {
    if (selection.size === 0) return "";

    const t = tableRef.current;
    const rows = t.getRowModel().rows;
    const cols = t
      .getVisibleLeafColumns()
      .filter((c) => !EXCLUDED_COLUMNS.includes(c.id));

    const rowIds = rows.map((r) => r.id);
    const colIds = cols.map((c) => c.id);

    const selectedRowIds = rowIds.filter((rId) =>
      colIds.some((cId) => selection.has(cellKey(rId, cId))),
    );
    const selectedColIds = colIds.filter((cId) =>
      rowIds.some((rId) => selection.has(cellKey(rId, cId))),
    );

    return selectedRowIds
      .map((rId) => {
        const row = rows.find((r) => r.id === rId)!;
        return selectedColIds
          .map((cId) => {
            if (!selection.has(cellKey(rId, cId))) return "";
            const cell = row.getAllCells().find((c) => c.column.id === cId);
            return cell ? cellValue(cell) : "";
          })
          .join("\t");
      })
      .join("\n");
  }, [selection]);

  // ── Ctrl+C ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== "c") return;
      const tsv = getSelectionTsv();
      if (tsv) navigator.clipboard.writeText(tsv);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [getSelectionTsv]);

  const handleCellClick = useCallback(
    (e: React.MouseEvent, cell: Cell<TData, unknown>) => {
      // Ignore clicks on action columns entirely
      if (isActionColumn(cell.column.id)) return;

      const key = cellKey(cell.row.id, cell.column.id);

      if (e.shiftKey && anchorRef.current) {
        const rows = tableRef.current.getRowModel().rows;
        // Exclude first two columns from range selection as well
        const cols = tableRef.current
          .getVisibleLeafColumns()
          .filter((c) => !EXCLUDED_COLUMN_SET.has(c.id));

        const anchorRowIdx = rows.findIndex(
          (r) => r.id === anchorRef.current!.rowId,
        );
        const anchorColIdx = cols.findIndex(
          (c) => c.id === anchorRef.current!.columnId,
        );
        const clickRowIdx = rows.findIndex((r) => r.id === cell.row.id);
        const clickColIdx = cols.findIndex((c) => c.id === cell.column.id);

        const r1 = Math.min(anchorRowIdx, clickRowIdx);
        const r2 = Math.max(anchorRowIdx, clickRowIdx);
        const c1 = Math.min(anchorColIdx, clickColIdx);
        const c2 = Math.max(anchorColIdx, clickColIdx);

        const next = new Set<string>();
        for (let r = r1; r <= r2; r++)
          for (let c = c1; c <= c2; c++)
            next.add(cellKey(rows[r].id, cols[c].id));

        setSelection(next);
      } else if (e.ctrlKey || e.metaKey) {
        anchorRef.current = { rowId: cell.row.id, columnId: cell.column.id };
        setSelection((prev) => {
          const next = new Set(prev);
          next.has(key) ? next.delete(key) : next.add(key);
          return next;
        });
      } else {
        anchorRef.current = { rowId: cell.row.id, columnId: cell.column.id };
        setSelection(new Set([key]));
      }
    },
    [isActionColumn],
  );

  // Right-click must never require a modifier key to preserve an existing
  // range — Shift held into a right-click makes the browser ignore
  // preventDefault() and show its native context menu regardless (a
  // hardcoded browser behavior, not something JS can override), which is
  // why range selection can't depend on shiftKey here. A cell already part
  // of the selection keeps the whole range; anything else collapses to
  // just that cell, mirroring how row context-click already behaves.
  const handleCellContextClick = useCallback(
    (cell: Cell<TData, unknown>) => {
      if (isActionColumn(cell.column.id)) return;
      const key = cellKey(cell.row.id, cell.column.id);
      if (!selection.has(key)) {
        anchorRef.current = { rowId: cell.row.id, columnId: cell.column.id };
        setSelection(new Set([key]));
      }
    },
    [isActionColumn, selection],
  );

  const clearSelection = useCallback(() => {
    setSelection(new Set());
    anchorRef.current = null;
  }, []);

  const isCellSelected = useCallback(
    (rowId: string, columnId: string) =>
      !isActionColumn(columnId) && selection.has(cellKey(rowId, columnId)),
    [selection, isActionColumn],
  );

  return {
    isCellSelected,
    handleCellClick,
    handleCellContextClick,
    clearSelection,
    selectionSize: selection.size,
    getSelectionTsv,
  };
}
