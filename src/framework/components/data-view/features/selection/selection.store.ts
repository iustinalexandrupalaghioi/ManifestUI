import { create } from "zustand"

interface SelectionState {
  rowSelection: Record<string, boolean>
}

interface SelectionActions {
  setRowSelection(s: Record<string, boolean>): void
}

type SelectionStore = SelectionState & SelectionActions

// Keyed by tableId only — selection is intentionally shared between
// table view and list view. Selecting rows in table mode keeps them
// selected when the user switches to list mode.
const stores = new Map<string, ReturnType<typeof createSelectionStore>>()

function createSelectionStore() {
  return create<SelectionStore>()((set) => ({
    rowSelection: {},
    setRowSelection: (rowSelection) => set({ rowSelection }),
  }))
}

export function getSelectionStore(tableId: string) {
  if (!stores.has(tableId)) stores.set(tableId, createSelectionStore())
  return stores.get(tableId)!
}

/** Called on DataView unmount — removes the store for this tableId. */
export function deleteSelectionStore(tableId: string) {
  stores.delete(tableId)
}
