"use client"

import {
  createContext,
  useContext,
  type ReactNode,
  type RefObject,
} from "react"
import type { Table } from "@tanstack/react-table"

// ─────────────────────────────────────────────────────────────────────────────
// Core context — stable references that almost never change.
// Components that only need the table instance or tableId subscribe here
// and won't re-render when layout state (height, isResizing) changes.
// ─────────────────────────────────────────────────────────────────────────────

interface DataViewCoreCtx {
  table: Table<any>
  tableId: string
  scrollContainerRef: RefObject<HTMLDivElement | null>
  handleScroll: () => void
  /** Which view type this provider instance is serving. */
  viewType: "table" | "list"
  staticColumnIds: RefObject<Set<string>>
}

const DataViewCoreContext = createContext<DataViewCoreCtx | null>(null)

export function useDataViewCore(): DataViewCoreCtx {
  const ctx = useContext(DataViewCoreContext)
  if (!ctx) {
    throw new Error(
      "useDataViewCore must be used within a <DataView> component."
    )
  }
  return ctx
}

// ─────────────────────────────────────────────────────────────────────────────
// Layout context — changes frequently (height recalculates on resize,
// isResizing flips during column drag). Kept separate so layout-unaware
// components (FilterChips, ViewBar, etc.) are never re-rendered by it.
// ─────────────────────────────────────────────────────────────────────────────

interface DataViewLayoutCtx {
  height: number | undefined
  isResizing: boolean
}

const DataViewLayoutContext = createContext<DataViewLayoutCtx | null>(null)

export function useDataViewLayout(): DataViewLayoutCtx {
  const ctx = useContext(DataViewLayoutContext)
  if (!ctx) {
    throw new Error(
      "useDataViewLayout must be used within a <DataView> component."
    )
  }
  return ctx
}

// ─────────────────────────────────────────────────────────────────────────────
// Provider — wraps both contexts in a single component so DataView.tsx
// only has one provider to render.
// ─────────────────────────────────────────────────────────────────────────────

interface DataViewProviderProps {
  core: DataViewCoreCtx
  layout: DataViewLayoutCtx
  children: ReactNode
}

export function DataViewProvider({
  core,
  layout,
  children,
}: DataViewProviderProps) {
  return (
    <DataViewCoreContext.Provider value={core}>
      <DataViewLayoutContext.Provider value={layout}>
        {children}
      </DataViewLayoutContext.Provider>
    </DataViewCoreContext.Provider>
  )
}
