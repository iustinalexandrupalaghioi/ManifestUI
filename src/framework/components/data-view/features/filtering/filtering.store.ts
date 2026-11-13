import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { FilterRule } from "./filters"

interface FilteringState {
  rules: FilterRule[]
  panelOpen: boolean
  focusColumnId: string | null
}

interface FilteringActions {
  setRules(rules: FilterRule[]): void
  openPanel(columnId?: string): void
  closePanel(): void
}

type FilteringStore = FilteringState & FilteringActions

// Key is `${tableId}:${viewId}` — one store per view instance.
// Table views and list views never share filter state even when
// displayed in the same DataView.
const stores = new Map<string, ReturnType<typeof createFilteringStore>>()

function createFilteringStore(initial: FilterRule[] = []) {
  return create<FilteringStore>()(
    subscribeWithSelector((set) => ({
      rules: initial,
      panelOpen: false,
      focusColumnId: null,
      setRules: (rules) => set({ rules }),
      openPanel: (columnId) =>
        set({ panelOpen: true, focusColumnId: columnId ?? null }),
      closePanel: () => set({ panelOpen: false, focusColumnId: null }),
    }))
  )
}

export function getFilteringStore(
  tableId: string,
  viewId: string,
  initial?: FilterRule[]
) {
  const key = `${tableId}:${viewId}`
  if (!stores.has(key)) stores.set(key, createFilteringStore(initial))
  return stores.get(key)!
}

/** Called on DataView unmount — removes all filtering stores for this tableId. */
export function deleteFilteringStores(tableId: string) {
  for (const key of stores.keys()) {
    if (key.startsWith(`${tableId}:`)) stores.delete(key)
  }
}
