import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { AggregateRule } from "./aggregates"

interface AggregatesState {
  rules: AggregateRule[]
  panelOpen: boolean
  focusColumnId: string | null
}

interface AggregatesActions {
  setRules(rules: AggregateRule[]): void
  openPanel(columnId?: string): void
  closePanel(): void
}

type AggregatesStore = AggregatesState & AggregatesActions

// Key is `${tableId}:${viewId}` — one store per view instance, matching
// the filtering/sorting store scoping so the three never drift apart.
const stores = new Map<string, ReturnType<typeof createAggregatesStore>>()

function createAggregatesStore(initial: AggregateRule[] = []) {
  return create<AggregatesStore>()(
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

export function getAggregatesStore(
  tableId: string,
  viewId: string,
  initial?: AggregateRule[]
) {
  const key = `${tableId}:${viewId}`
  if (!stores.has(key)) stores.set(key, createAggregatesStore(initial))
  return stores.get(key)!
}

/** Called on DataView unmount — removes all aggregates stores for this tableId. */
export function deleteAggregatesStores(tableId: string) {
  for (const key of stores.keys()) {
    if (key.startsWith(`${tableId}:`)) stores.delete(key)
  }
}
