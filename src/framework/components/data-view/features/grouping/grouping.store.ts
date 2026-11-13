import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import type { GroupByRule } from "./grouping"

interface GroupingState {
  grouping: GroupByRule[]
  panelOpen: boolean
}

interface GroupingActions {
  setGrouping(grouping: GroupByRule[]): void
  openPanel(): void
  closePanel(): void
}

type GroupingStore = GroupingState & GroupingActions

// Key is `${tableId}:${viewId}` — one store per view instance, matching
// the aggregates/filtering/sorting store scoping so they never drift apart.
const stores = new Map<string, ReturnType<typeof createGroupingStore>>()

function createGroupingStore(initial: GroupByRule[] = []) {
  return create<GroupingStore>()(
    subscribeWithSelector((set) => ({
      grouping: initial,
      panelOpen: false,
      setGrouping: (grouping) => set({ grouping }),
      openPanel: () => set({ panelOpen: true }),
      closePanel: () => set({ panelOpen: false }),
    }))
  )
}

export function getGroupingStore(
  tableId: string,
  viewId: string,
  initial?: GroupByRule[]
) {
  const key = `${tableId}:${viewId}`
  if (!stores.has(key)) stores.set(key, createGroupingStore(initial))
  return stores.get(key)!
}

/** Called on DataView unmount — removes all grouping stores for this tableId. */
export function deleteGroupingStores(tableId: string) {
  for (const key of stores.keys()) {
    if (key.startsWith(`${tableId}:`)) stores.delete(key)
  }
}
