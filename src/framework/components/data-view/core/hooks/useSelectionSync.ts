import { useEffect, useRef } from "react";
import { getSelectionStore } from "../../features/selection/selection.store";

function sameSelection(a: Record<string, boolean>, b: Record<string, boolean>) {
  const aKeys = Object.keys(a)
    .filter((k) => a[k])
    .sort();
  const bKeys = Object.keys(b)
    .filter((k) => b[k])
    .sort();
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((k, i) => k === bKeys[i]);
}

/**
 * Keeps the overview's local row selection and the table's selection store
 * in step, in both directions, without echoing a change back to its source.
 */
export function useSelectionSync(
  tableId: string,
  rowSelection: Record<string, boolean>,
  setRowSelection: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
) {
  const selectionStore = getSelectionStore(tableId);
  const storedSelection = selectionStore((s) => s.rowSelection);
  const lastSyncRef = useRef<"toStore" | "toLocal" | null>(null);

  useEffect(() => {
    if (lastSyncRef.current === "toLocal") {
      lastSyncRef.current = null;
      return;
    }
    if (!sameSelection(rowSelection, storedSelection)) {
      lastSyncRef.current = "toStore";
      selectionStore.getState().setRowSelection(rowSelection);
    }
  }, [rowSelection]);

  useEffect(() => {
    if (lastSyncRef.current === "toStore") {
      lastSyncRef.current = null;
      return;
    }
    if (!sameSelection(storedSelection, rowSelection)) {
      lastSyncRef.current = "toLocal";
      setRowSelection(storedSelection);
    }
  }, [storedSelection]);
}
