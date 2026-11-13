import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { SortingState } from "@tanstack/react-table"

interface SortingStoreState {
  sorting: SortingState
  panelOpen: boolean
}

interface SortingStoreActions {
  setSorting(s: SortingState): void
  openPanel(): void
  closePanel(): void
}

type SortingStore = SortingStoreState & SortingStoreActions

// Key is `${tableId}:${viewId}` — one store per view instance,
// matching the filtering store scoping so the two never drift apart.
const stores = new Map<string, ReturnType<typeof createSortingStore>>()

function createSortingStore(initial: SortingState = []) {
  return create<SortingStore>()(
    subscribeWithSelector((set) => ({
      sorting: initial,
      panelOpen: false,
      setSorting: (sorting) => set({ sorting }),
      openPanel: () => set({ panelOpen: true }),
      closePanel: () => set({ panelOpen: false }),
    })),
  )
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
