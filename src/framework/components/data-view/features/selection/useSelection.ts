"use client";

import type { Row, Table } from "@tanstack/react-table";
import { useCallback, useRef } from "react";
import { getSelectionStore } from "./selection.store";
import type { SelectionFeatureApi } from "./selection.contract";

/**
 * useSelection
 *
 * Encapsulates all row-selection logic and wires it to the per-tableId
 * SelectionStore. Keyed by tableId only — shared across table and list mode
 * so selections survive a mode switch.
 */
export function useSelection<TData>(
  tableId: string,
  table: Table<TData>,
  options?: { openOnClick?: boolean },
): SelectionFeatureApi {
  const openOnClick = options?.openOnClick ?? false;
  const store = getSelectionStore(tableId);
  const rowSelection = store((s) => s.rowSelection);
  const setRowSelection = store((s) => s.setRowSelection);

  const tableRef = useRef(table);
  tableRef.current = table;

  const lastClickedIndexRef = useRef<number | null>(null);

  const handleRowClick = useCallback(
    (e: React.MouseEvent, row: Row<TData>) => {
      const t = tableRef.current;
      const allRows = t.getRowModel().rows;
      const clickedIndex = allRows.findIndex((r) => r.id === row.id);

      // Checkbox clicks toggle without affecting others
      if ((e.target as HTMLElement).closest("[data-checkbox]")) {
        lastClickedIndexRef.current = clickedIndex;
        row.toggleSelected();
        return;
      }

      if (e.shiftKey && lastClickedIndexRef.current !== null) {
        // Range select
        const from = Math.min(lastClickedIndexRef.current, clickedIndex);
        const to = Math.max(lastClickedIndexRef.current, clickedIndex);
        const next: Record<string, boolean> = {};
        for (let i = from; i <= to; i++) {
          next[allRows[i].id] = true;
        }
        t.setRowSelection(next);
      } else if (e.ctrlKey || e.metaKey) {
        // Toggle without clearing others
        lastClickedIndexRef.current = clickedIndex;
        row.toggleSelected();
      } else if (openOnClick) {
        lastClickedIndexRef.current = clickedIndex;
        t.setRowSelection({ [row.id]: true });
        const col = t
          .getAllLeafColumns()
          .find((c) => c.columnDef.meta?.onOpen != null);
        col?.columnDef.meta!.onOpen!([row]);
      } else {
        // Exclusive select
        lastClickedIndexRef.current = clickedIndex;
        const isAlreadyOnlySelected =
          row.getIsSelected() &&
          Object.keys(t.getState().rowSelection).length === 1;
        if (isAlreadyOnlySelected) {
          t.setRowSelection({});
        } else {
          t.setRowSelection({ [row.id]: true });
        }
      }
    },
    [openOnClick],
  );

  const handleRowContextClick = useCallback((row: Row<TData>) => {
    const t = tableRef.current;
    const sel = t.getState().rowSelection;
    const isInMultiSelection = Object.keys(sel).length > 1 && sel[row.id];
    const isAlreadySingleSelected =
      Object.keys(sel).length === 1 && sel[row.id];

    if (!isInMultiSelection && !isAlreadySingleSelected) {
      t.resetRowSelection();
      row.toggleSelected(true);
    }
  }, []);

  const handleRowDoubleClick = useCallback((row: Row<TData>) => {
    const t = tableRef.current;
    const col = t
      .getAllLeafColumns()
      .find((c) => c.columnDef.meta?.onOpen != null);
    if (!col) return;

    const selectedRows = t.getSelectedRowModel().rows;
    const targets =
      selectedRows.length > 1 && selectedRows.some((r) => r.id === row.id)
        ? selectedRows
        : [row];

    col.columnDef.meta!.onOpen!(targets);
  }, []);

  return {
    handleRowClick: handleRowClick as SelectionFeatureApi["handleRowClick"],
    handleRowDoubleClick:
      handleRowDoubleClick as SelectionFeatureApi["handleRowDoubleClick"],
    handleRowContextClick:
      handleRowContextClick as SelectionFeatureApi["handleRowContextClick"],
    rowSelection,
    setRowSelection,
  };
}
