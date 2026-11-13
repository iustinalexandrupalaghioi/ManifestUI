import { create } from "zustand"
import { persist } from "zustand/middleware"

interface ViewModeState {
  activeMode: "table" | "list"
  lastUsedViewId: {
    table: string | null
    list: string | null
  }
}

interface ViewModeActions {
  setMode(mode: "table" | "list"): void
  recordViewUsed(mode: "table" | "list", viewId: string): void
}

type ViewModeStore = ViewModeState & ViewModeActions

const stores = new Map<string, ReturnType<typeof createViewModeStore>>()
const DEFAULT_MODE = (
  process.env.NEXT_PUBLIC_DEFAULT_VIEW_MODE === "table" ? "table" : "list"
) as "table" | "list"

function createViewModeStore(tableId: string) {
  return create<ViewModeStore>()(
    persist(
      (set) => ({
        activeMode: DEFAULT_MODE,
        lastUsedViewId: { table: null, list: null },
        setMode: (mode) => set({ activeMode: mode }),
        recordViewUsed: (mode, viewId) =>
          set((s) => ({
            lastUsedViewId: { ...s.lastUsedViewId, [mode]: viewId },
          })),
      }),
      { name: `table-viewmode:${tableId}` }
    )
  )
}

export function getViewModeStore(tableId: string) {
  if (!stores.has(tableId)) stores.set(tableId, createViewModeStore(tableId))
  return stores.get(tableId)!
}

export function useActiveMode(tableId: string) {
  return getViewModeStore(tableId)((s) => s.activeMode)
}

export function useLastUsedViewId(tableId: string, mode: "table" | "list") {
  return getViewModeStore(tableId)((s) => s.lastUsedViewId[mode])
}

/** Called on DataView unmount — removes the store for this tableId. */
export function deleteViewModeStore(tableId: string) {
  stores.delete(tableId)
}
