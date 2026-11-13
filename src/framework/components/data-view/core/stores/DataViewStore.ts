import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"

interface CoreTableState {
  columnSizeVars: Record<string, number>
  height: number | undefined
  globalFilter: string
  isResizing: boolean
  searchOpen: boolean
}

interface CoreTableActions {
  setColumnSizeVars(vars: Record<string, number>): void
  setHeight(h: number | undefined): void
  setGlobalFilter(v: string): void
  setIsResizing(v: boolean): void
  setSearchOpen(v: boolean): void
}

type CoreStore = CoreTableState & CoreTableActions

const stores = new Map<string, ReturnType<typeof createCoreStore>>()

function createCoreStore() {
  return create<CoreStore>()(
    subscribeWithSelector((set) => ({
      columnSizeVars: {},
      height: undefined,
      globalFilter: "",
      isResizing: false,
      searchOpen: false,
      setColumnSizeVars: (vars) => set({ columnSizeVars: vars }),
      setHeight: (h) => set({ height: h }),
      setGlobalFilter: (v) => set({ globalFilter: v }),
      setIsResizing: (v) => set({ isResizing: v }),
      setSearchOpen: (v) => set({ searchOpen: v }),
    }))
  )
}

export function getCoreStore(tableId: string) {
  if (!stores.has(tableId)) stores.set(tableId, createCoreStore())
  return stores.get(tableId)!
}

export function useCoreStore<T>(
  tableId: string,
  selector: (s: CoreStore) => T
): T {
  return getCoreStore(tableId)(selector)
}

/** Called on DataView unmount — removes the store for this tableId. */
export function deleteCoreStore(tableId: string) {
  stores.delete(tableId)
}
