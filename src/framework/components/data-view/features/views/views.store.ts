import type { VisibilityState } from "@tanstack/react-table"
import { create } from "zustand"
import { subscribeWithSelector } from "zustand/middleware"
import { getViewModeStore } from "../../core/stores/ViewModeStore"
import { getFilteringStore } from "../filtering/filtering.store"
import { getSortingStore } from "../sorting/sorting.store"
import { getAggregatesStore } from "../aggregates/aggregates.store"
import type { AggregateRule } from "../aggregates/aggregates"
import type {
  ListViewRecord,
  PersistedViewState,
  TableViewRecord,
} from "./views.types"
import { DEFAULT_LIST_VIEW_ID, DEFAULT_TABLE_VIEW_ID } from "./views.types"

// ─────────────────────────────────────────────────────────────────────────────
// Default state factory
// ─────────────────────────────────────────────────────────────────────────────

function makeDefaultState(
  defaultViewName: string,
  initialColumnVisibility: VisibilityState,
  initialListColumnVisibility: VisibilityState,
  initialAggregates: AggregateRule[] = []
): PersistedViewState {
  return {
    tableViews: {
      activeViewId: DEFAULT_TABLE_VIEW_ID,
      views: [
        {
          id: DEFAULT_TABLE_VIEW_ID,
          name: defaultViewName,
          type: "table",
          columnVisibility: initialColumnVisibility,
          columnSizing: {},
          columnOrder: [],
          columnPinning: { left: [] },
          sorting: [],
          filters: [],
          aggregates: initialAggregates,
        },
      ],
    },
    listViews: {
      activeViewId: DEFAULT_LIST_VIEW_ID,
      views: [
        {
          id: DEFAULT_LIST_VIEW_ID,
          name: defaultViewName,
          type: "list",
          listColumnVisibility: initialListColumnVisibility,
          listColumnOrder: [],
          sorting: [],
          filters: [],
          aggregates: initialAggregates,
        },
      ],
    },
  }
}

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
  initialAggregates: AggregateRule[] = []
) {
  const defaultState = makeDefaultState(
    defaultViewName,
    initialColumnVisibility,
    initialListColumnVisibility,
    initialAggregates
  )

  return create<ViewsStore>()(
    subscribeWithSelector((set, get) => ({
      persisted: defaultState,
      tableDraft: null,
      listDraft: null,

      hydrate: (state) => set({ persisted: state }),

      // ── Table view CRUD ────────────────────────────────────────────────

      switchTableView: (id) => {
        set((s) => ({
          persisted: {
            ...s.persisted,
            tableViews: { ...s.persisted.tableViews, activeViewId: id },
          },
          tableDraft: null,
        }))
        getViewModeStore(tableId).getState().recordViewUsed("table", id)
      },

      saveTableChanges: () => {
        const { persisted, tableDraft } = get()

        if (!tableDraft) return
        const activeId = persisted.tableViews.activeViewId
        set({
          persisted: {
            ...persisted,
            tableViews: {
              ...persisted.tableViews,
              views: persisted.tableViews.views.map((v) =>
                v.id === activeId ? { ...v, ...tableDraft } : v
              ),
            },
          },
          tableDraft: null,
        })
      },

      discardTableChanges: () => {
        const { persisted } = get()
        const activeId = persisted.tableViews.activeViewId
        const activeView =
          persisted.tableViews.views.find((v) => v.id === activeId) ??
          persisted.tableViews.views[0]
        if (activeView) {
          getSortingStore(tableId, activeView.id).setState({
            sorting: activeView.sorting,
          })
          getFilteringStore(tableId, activeView.id).setState({
            rules: activeView.filters,
          })
          getAggregatesStore(tableId, activeView.id).setState({
            rules: activeView.aggregates ?? [],
          })
        }
        set({ tableDraft: null })
      },

      saveAsTableView: (name) => {
        const { persisted, tableDraft } = get()
        const active =
          persisted.tableViews.views.find(
            (v) => v.id === persisted.tableViews.activeViewId
          ) ?? persisted.tableViews.views[0]
        const newView: TableViewRecord = {
          id: crypto.randomUUID(),
          name,
          type: "table",
          columnVisibility:
            tableDraft?.columnVisibility ?? active.columnVisibility,
          columnSizing: tableDraft?.columnSizing ?? active.columnSizing,
          columnOrder: tableDraft?.columnOrder ?? active.columnOrder,
          columnPinning: tableDraft?.columnPinning ?? active.columnPinning,
          sorting: tableDraft?.sorting ?? active.sorting,
          filters: tableDraft?.filters ?? active.filters,
          aggregates: tableDraft?.aggregates ?? active.aggregates ?? [],
        }
        set({
          persisted: {
            ...persisted,
            tableViews: {
              activeViewId: newView.id,
              views: [...persisted.tableViews.views, newView],
            },
          },
          tableDraft: null,
        })
        getViewModeStore(tableId).getState().recordViewUsed("table", newView.id)
      },

      deleteTableView: (id) => {
        if (id === DEFAULT_TABLE_VIEW_ID) return
        const { persisted } = get()
        const remaining = persisted.tableViews.views.filter((v) => v.id !== id)
        const newActiveId = remaining.at(-1)?.id ?? DEFAULT_TABLE_VIEW_ID
        set({
          persisted: {
            ...persisted,
            tableViews: { activeViewId: newActiveId, views: remaining },
          },
          tableDraft: null,
        })
      },

      renameTableView: (id, name) => {
        set((s) => ({
          persisted: {
            ...s.persisted,
            tableViews: {
              ...s.persisted.tableViews,
              views: s.persisted.tableViews.views.map((v) =>
                v.id === id ? { ...v, name } : v
              ),
            },
          },
        }))
      },

      // ── List view CRUD ─────────────────────────────────────────────────

      switchListView: (id) => {
        set((s) => ({
          persisted: {
            ...s.persisted,
            listViews: { ...s.persisted.listViews, activeViewId: id },
          },
          listDraft: null,
        }))
        getViewModeStore(tableId).getState().recordViewUsed("list", id)
      },

      saveListChanges: () => {
        const { persisted, listDraft } = get()
        if (!listDraft) return
        const activeId = persisted.listViews.activeViewId
        set({
          persisted: {
            ...persisted,
            listViews: {
              ...persisted.listViews,
              views: persisted.listViews.views.map((v) =>
                v.id === activeId ? { ...v, ...listDraft } : v
              ),
            },
          },
          listDraft: null,
        })
      },

      discardListChanges: () => {
        const { persisted } = get()
        const activeId = persisted.listViews.activeViewId
        const activeView =
          persisted.listViews.views.find((v) => v.id === activeId) ??
          persisted.listViews.views[0]
        if (activeView) {
          getSortingStore(tableId, activeView.id).setState({
            sorting: activeView.sorting,
          })
          getFilteringStore(tableId, activeView.id).setState({
            rules: activeView.filters,
          })
          getAggregatesStore(tableId, activeView.id).setState({
            rules: activeView.aggregates ?? [],
          })
        }
        set({ listDraft: null })
      },

      saveAsListView: (name) => {
        const { persisted, listDraft } = get()
        const active =
          persisted.listViews.views.find(
            (v) => v.id === persisted.listViews.activeViewId
          ) ?? persisted.listViews.views[0]
        const newView: ListViewRecord = {
          id: crypto.randomUUID(),
          name,
          type: "list",
          listColumnVisibility:
            listDraft?.listColumnVisibility ?? active.listColumnVisibility,
          listColumnOrder: listDraft?.listColumnOrder ?? active.listColumnOrder,
          sorting: listDraft?.sorting ?? active.sorting,
          filters: listDraft?.filters ?? active.filters,
          aggregates: listDraft?.aggregates ?? active.aggregates ?? [],
        }
        set({
          persisted: {
            ...persisted,
            listViews: {
              activeViewId: newView.id,
              views: [...persisted.listViews.views, newView],
            },
          },
          listDraft: null,
        })
        getViewModeStore(tableId).getState().recordViewUsed("list", newView.id)
      },

      deleteListView: (id) => {
        if (id === DEFAULT_LIST_VIEW_ID) return
        const { persisted } = get()
        const remaining = persisted.listViews.views.filter((v) => v.id !== id)
        const newActiveId = remaining.at(-1)?.id ?? DEFAULT_LIST_VIEW_ID
        set({
          persisted: {
            ...persisted,
            listViews: { activeViewId: newActiveId, views: remaining },
          },
          listDraft: null,
        })
      },

      renameListView: (id, name) => {
        set((s) => ({
          persisted: {
            ...s.persisted,
            listViews: {
              ...s.persisted.listViews,
              views: s.persisted.listViews.views.map((v) =>
                v.id === id ? { ...v, name } : v
              ),
            },
          },
        }))
      },

      // ── Draft mutations ────────────────────────────────────────────────

      updateTableDraft: (patch) => {
        set((s) => ({ tableDraft: { ...(s.tableDraft ?? {}), ...patch } }))
      },

      updateListDraft: (patch) => {
        set((s) => ({ listDraft: { ...(s.listDraft ?? {}), ...patch } }))
      },
    }))
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
  initialAggregates: AggregateRule[] = []
) {
  if (!stores.has(tableId)) {
    stores.set(
      tableId,
      createViewsStore(
        tableId,
        defaultViewName,
        initialColumnVisibility,
        initialListColumnVisibility,
        initialAggregates
      )
    )
  }
  return stores.get(tableId)!
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
