import { create } from "zustand"
import type { SortingState } from "@tanstack/react-table"

interface SortingStoreState {
  sorting: SortingState
}

interface SortingStoreActions {
  setSorting(s: SortingState): void
}

type SortingStore = SortingStoreState & SortingStoreActions

// Key is `${tableId}:${viewId}` — one store per view instance,
// matching the filtering store scoping so the two never drift apart.
const stores = new Map<string, ReturnType<typeof createSortingStore>>()

function createSortingStore(initial: SortingState = []) {
  return create<SortingStore>()((set) => ({
    sorting: initial,
    setSorting: (sorting) => set({ sorting }),
  }))
}

export function getSortingStore(
  tableId: string,
  viewId: string,
  initial?: SortingState
) {
  const key = `${tableId}:${viewId}`
  if (!stores.has(key)) stores.set(key, createSortingStore(initial))
  return stores.get(key)!
}

/** Called on DataView unmount — removes all sorting stores for this tableId. */
export function deleteSortingStores(tableId: string) {
  for (const key of stores.keys()) {
    if (key.startsWith(`${tableId}:`)) stores.delete(key)
  }
}
