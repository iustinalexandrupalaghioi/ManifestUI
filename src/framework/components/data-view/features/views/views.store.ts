import type { VisibilityState } from "@tanstack/react-table"
import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { getViewModeStore } from "../../core/stores/ViewModeStore"
import { getFilteringStore } from "../filtering/filtering.store"
import { getSortingStore } from "../sorting/sorting.store"
import type { AggregateRule } from "../aggregates/aggregates"
import type { GroupByRule } from "../grouping/grouping"
import type { ListViewRecord, PersistedViewState, TableViewRecord } from "./views.types"
import type { ResolvedViewDefaults } from "./viewDefaults"
import {
  activeViewOf,
  addViewFromActive,
  makeDefaultState,
  removeView,
  renameView,
  restoreViewStores,
  saveDraft,
  switchView,
  type ViewKind,
} from "./views.operations"

// ─────────────────────────────────────────────────────────────────────────────
// Store shape
// ─────────────────────────────────────────────────────────────────────────────

interface ViewsState {
  persisted: PersistedViewState
  tableDraft: Partial<TableViewRecord> | null
  listDraft: Partial<ListViewRecord> | null
}

interface ViewsActions {
  hydrate(state: PersistedViewState): void
  // Table view CRUD
  switchTableView(id: string): void
  saveTableChanges(): void
  discardTableChanges(): void
  saveAsTableView(name: string): void
  deleteTableView(id: string): void
  renameTableView(id: string, name: string): void
  // List view CRUD
  switchListView(id: string): void
  saveListChanges(): void
  discardListChanges(): void
  saveAsListView(name: string): void
  deleteListView(id: string): void
  renameListView(id: string, name: string): void
  // Draft mutations
  updateTableDraft(patch: Partial<TableViewRecord>): void
  updateListDraft(patch: Partial<ListViewRecord>): void
}

type ViewsStore = ViewsState & ViewsActions

// ─────────────────────────────────────────────────────────────────────────────
// Store map
// ─────────────────────────────────────────────────────────────────────────────

const stores = new Map<string, ReturnType<typeof createViewsStore>>()

function createViewsStore(
  tableId: string,
  defaultViewName: string,
  initialColumnVisibility: VisibilityState,
  initialListColumnVisibility: VisibilityState,
  initialAggregates: AggregateRule[] = [],
  initialGrouping: GroupByRule[] = [],
  defaults?: ResolvedViewDefaults
) {
  const defaultState = makeDefaultState(
    defaultViewName,
    initialColumnVisibility,
    initialListColumnVisibility,
    initialAggregates,
    initialGrouping,
    defaults
  )

  return create<ViewsStore>()(
    subscribeWithSelector((set, get) => {
      const draftKey = (kind: ViewKind): "tableDraft" | "listDraft" => (kind === "table" ? "tableDraft" : "listDraft")
      const switchTo = (kind: ViewKind, id: string) => {
        set((s) => ({ persisted: switchView(s.persisted, kind, id), [draftKey(kind)]: null }))
        getViewModeStore(tableId).getState().recordViewUsed(kind, id)
      }
      const save = (kind: ViewKind) => {
        const state = get()
        const draft = state[draftKey(kind)]
        if (!draft) return
        set({ persisted: saveDraft(state.persisted, kind, draft), [draftKey(kind)]: null })
      }
      const discard = (kind: ViewKind) => {
        restoreViewStores(tableId, activeViewOf(get().persisted, kind))
        set({ [draftKey(kind)]: null })
      }
      const saveAs = (kind: ViewKind, name: string) => {
        const state = get()
        const { persisted, view } = addViewFromActive(state.persisted, kind, state[draftKey(kind)], name)
        set({ persisted, [draftKey(kind)]: null })
        getViewModeStore(tableId).getState().recordViewUsed(kind, view.id)
      }
      const remove = (kind: ViewKind, id: string) => {
        const persisted = removeView(get().persisted, kind, id)
        if (persisted) set({ persisted, [draftKey(kind)]: null })
      }

      return {
        persisted: defaultState,
        tableDraft: null,
        listDraft: null,

        hydrate: (state) => set({ persisted: state }),

        // ── View CRUD (the same operations for grid and card views) ─────────

        switchTableView: (id) => switchTo("table", id),
        saveTableChanges: () => save("table"),
        discardTableChanges: () => discard("table"),
        saveAsTableView: (name) => saveAs("table", name),
        deleteTableView: (id) => remove("table", id),
        renameTableView: (id, name) => set((s) => ({ persisted: renameView(s.persisted, "table", id, name) })),

        switchListView: (id) => switchTo("list", id),
        saveListChanges: () => save("list"),
        discardListChanges: () => discard("list"),
        saveAsListView: (name) => saveAs("list", name),
        deleteListView: (id) => remove("list", id),
        renameListView: (id, name) => set((s) => ({ persisted: renameView(s.persisted, "list", id, name) })),

        // ── Draft mutations ────────────────────────────────────────────────

        updateTableDraft: (patch) => {
          set((s) => ({ tableDraft: { ...(s.tableDraft ?? {}), ...patch } }))
        },

        updateListDraft: (patch) => {
          set((s) => ({ listDraft: { ...(s.listDraft ?? {}), ...patch } }))
        },
      }
    })
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

export function getViewsStore(
  tableId: string,
  defaultViewName = "Default",
  initialColumnVisibility: VisibilityState = {},
  initialListColumnVisibility: VisibilityState = {},
  initialAggregates: AggregateRule[] = [],
  initialGrouping: GroupByRule[] = [],
  defaults?: ResolvedViewDefaults
) {
  if (!stores.has(tableId)) {
    stores.set(
      tableId,
      createViewsStore(
        tableId,
        defaultViewName,
        initialColumnVisibility,
        initialListColumnVisibility,
        initialAggregates,
        initialGrouping,
        defaults
      )
    )
  }
  const store = stores.get(tableId)!
  // DataView drops sort/filter stores on unmount; recreate them from the active views (no-op if present).
  const { tableViews, listViews } = store.getState().persisted
  for (const { activeViewId, views } of [tableViews, listViews]) {
    const view = views.find((candidate) => candidate.id === activeViewId) ?? views[0]
    if (!view) continue
    getSortingStore(tableId, view.id, view.sorting)
    getFilteringStore(tableId, view.id, view.filters)
  }
  return store
}

export function deleteViewsStore(tableId: string) {
  stores.delete(tableId)
}

// ─────────────────────────────────────────────────────────────────────────────
// Selectors
// ─────────────────────────────────────────────────────────────────────────────

export function useActiveTableView(tableId: string) {
  const store = getViewsStore(tableId)
  return store((s) => {
    const { activeViewId, views } = s.persisted.tableViews
    return views.find((v) => v.id === activeViewId) ?? views[0]
  })
}

export function useActiveListView(tableId: string) {
  const store = getViewsStore(tableId)
  return store((s) => {
    const { activeViewId, views } = s.persisted.listViews
    return views.find((v) => v.id === activeViewId) ?? views[0]
  })
}

export function useTableHasChanges(tableId: string) {
  return getViewsStore(tableId)((s) => s.tableDraft !== null)
}

export function useListHasChanges(tableId: string) {
  return getViewsStore(tableId)((s) => s.listDraft !== null)
}

export function hasViewsStore(tableId: string) {
  return stores.has(tableId)
}
