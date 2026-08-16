"use client";

import type { Cell, Table } from "@tanstack/react-table";
import { useEffect, useRef } from "react";
import { getEditingStore } from "./editing.store";
import {
  isEditableCell,
  isFieldEditableForRow,
  type CellAddress,
} from "./editing.contract";

const PRINTABLE_KEY = /^.$/u;

export function useEditing<TData>(
  tableId: string,
  table: Table<TData>,
  selectedCell: CellAddress | null,
) {
  const store = getEditingStore(tableId);
  const armed = store((s) => s.armed);
  const editingCell = store((s) => s.editingCell);

  const tableRef = useRef(table);
  tableRef.current = table;
  const selectedCellRef = useRef(selectedCell);
  selectedCellRef.current = selectedCell;

  const canUpdate = !!table.options.meta?.updateManyAsync;

  const handleCellDoubleClick = (cell: Cell<TData, unknown>): boolean => {
    if (!armed || !canUpdate || !isEditableCell(cell)) return false;
    store
      .getState()
      .startEditing({ rowId: cell.row.id, columnId: cell.column.id });
    return true;
  };

  useEffect(() => {
    if (!armed || !canUpdate) return;

    const onKeyDown = (e: KeyboardEvent) => {
      const target = selectedCellRef.current;
      if (!target || editingCell) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      const column = tableRef.current.getColumn(target.columnId);
      const meta = column?.columnDef.meta?.editableField;
      if (!meta) return;

      if (e.key === "Enter") {
        e.preventDefault();
        store.getState().startEditing(target);
        return;
      }

      if (meta.kind === "direct" && PRINTABLE_KEY.test(e.key)) {
        const row = tableRef.current.getRow(target.rowId);
        const pending = store.getState().pendingEdits[target.rowId];
        const rowData = {
          ...(row.original as Record<string, unknown>),
          ...pending,
        };
        if (!isFieldEditableForRow(meta, rowData)) return;

        e.preventDefault();
        store.getState().startEditing({ ...target, seed: e.key });
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [armed, canUpdate, editingCell, store]);

  return { armed, canUpdate, handleCellDoubleClick };
}
