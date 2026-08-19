import { create } from "zustand";

export interface CellAddress {
  rowId: string;
  columnId: string;
  seed?: string;
}

interface EditingState {
  editMode: boolean;
  editingCell: CellAddress | null;
  pendingEdits: Record<string, Record<string, unknown>>;
}

interface EditingActions {
  setEditMode(editMode: boolean): void;
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
    editMode: false,
    editingCell: null,
    pendingEdits: {},

    setEditMode: (editMode) => set({ editMode, editingCell: null }),
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
          editMode: Object.keys(next).length > 0 ? s.editMode : false,
        };
      }),

    discardAll: () =>
      set({ editMode: false, editingCell: null, pendingEdits: {} }),
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
