import { create } from "zustand";

export interface CellAddress {
  rowId: string;
  columnId: string;
  seed?: string;
}

interface EditingState {
  armed: boolean;
  editingCell: CellAddress | null;
  pendingEdits: Record<string, Record<string, unknown>>;
}

interface EditingActions {
  setArmed(armed: boolean): void;
  startEditing(cell: CellAddress): void;
  stopEditing(): void;
  commitCellEdit(rowId: string, fields: Record<string, unknown>): void;
  clearRows(rowIds: string[]): void;
  discardAll(): void;
}

type EditingStore = EditingState & EditingActions;

const stores = new Map<string, ReturnType<typeof createEditingStore>>();

function createEditingStore() {
  return create<EditingStore>()((set) => ({
    armed: false,
    editingCell: null,
    pendingEdits: {},

    setArmed: (armed) => set({ armed, editingCell: null }),
    startEditing: (cell) => set({ editingCell: cell }),
    stopEditing: () => set({ editingCell: null }),

    commitCellEdit: (rowId, fields) =>
      set((s) => ({
        pendingEdits: {
          ...s.pendingEdits,
          [rowId]: { ...s.pendingEdits[rowId], ...fields },
        },
        editingCell: null,
      })),

    clearRows: (rowIds) =>
      set((s) => {
        const next = { ...s.pendingEdits };
        rowIds.forEach((id) => delete next[id]);
        return {
          pendingEdits: next,
          armed: Object.keys(next).length > 0 ? s.armed : false,
        };
      }),

    discardAll: () =>
      set({ armed: false, editingCell: null, pendingEdits: {} }),
  }));
}

export function getEditingStore(tableId: string) {
  if (typeof window === "undefined") return createEditingStore();

  if (!stores.has(tableId)) stores.set(tableId, createEditingStore());
  return stores.get(tableId)!;
}

export function deleteEditingStore(tableId: string) {
  stores.delete(tableId);
}
