import type { VisibilityState } from "@tanstack/react-table"
import { getFilteringStore } from "../filtering/filtering.store"
import { getSortingStore } from "../sorting/sorting.store"
import { getAggregatesStore } from "../aggregates/aggregates.store"
import type { AggregateRule } from "../aggregates/aggregates"
import { getGroupingStore } from "../grouping/grouping.store"
import type { GroupByRule } from "../grouping/grouping"
import type { ListViewRecord, PersistedViewState, TableViewRecord, ViewRecord } from "./views.types"
import { DEFAULT_LIST_VIEW_ID, DEFAULT_TABLE_VIEW_ID } from "./views.types"
import type { ResolvedViewDefaults } from "./viewDefaults"

/**
 * Pure state transitions on saved views, written once for both kinds: grid
 * ("table") views and card ("list") views. The store (views.store.ts) wires
 * them to zustand.
 */
export type ViewKind = "table" | "list"
export type ViewOf<K extends ViewKind> = K extends "table" ? TableViewRecord : ListViewRecord

interface ViewGroup<V> {
  activeViewId: string
  views: V[]
}

const DEFAULT_VIEW_ID: Record<ViewKind, string> = { table: DEFAULT_TABLE_VIEW_ID, list: DEFAULT_LIST_VIEW_ID }

/** The layout and data fields a new view copies (aggregates and grouping default to empty). */
const VIEW_FIELDS: Record<ViewKind, string[]> = {
  table: ["columnVisibility", "columnSizing", "columnOrder", "columnPinning", "sorting", "filters"],
  list: ["listColumnVisibility", "listColumnOrder", "sorting", "filters"],
}

function groupOf<K extends ViewKind>(persisted: PersistedViewState, kind: K): ViewGroup<ViewOf<K>> {
  return (kind === "table" ? persisted.tableViews : persisted.listViews) as ViewGroup<ViewOf<K>>
}

function withGroup<K extends ViewKind>(persisted: PersistedViewState, kind: K, group: ViewGroup<ViewOf<K>>): PersistedViewState {
  return kind === "table"
    ? { ...persisted, tableViews: group as ViewGroup<TableViewRecord> }
    : { ...persisted, listViews: group as ViewGroup<ListViewRecord> }
}

/** The active view of a kind (the first one if the active id is gone). */
export function activeViewOf<K extends ViewKind>(persisted: PersistedViewState, kind: K): ViewOf<K> {
  const { activeViewId, views } = groupOf(persisted, kind)
  return views.find((v) => v.id === activeViewId) ?? views[0]
}

export function switchView(persisted: PersistedViewState, kind: ViewKind, id: string): PersistedViewState {
  return withGroup(persisted, kind, { ...groupOf(persisted, kind), activeViewId: id })
}

/** Writes the unsaved changes into the active view. */
export function saveDraft<K extends ViewKind>(persisted: PersistedViewState, kind: K, draft: Partial<ViewOf<K>>): PersistedViewState {
  const group = groupOf(persisted, kind)
  return withGroup(persisted, kind, {
    ...group,
    views: group.views.map((v) => (v.id === group.activeViewId ? { ...v, ...draft } : v)),
  })
}

/** A new view from the active one plus its unsaved changes; it becomes the active view. */
export function addViewFromActive<K extends ViewKind>(
  persisted: PersistedViewState,
  kind: K,
  draft: Partial<ViewOf<K>> | null,
  name: string,
): { persisted: PersistedViewState; view: ViewOf<K> } {
  const active = activeViewOf(persisted, kind) as unknown as Record<string, unknown>
  const changes = (draft ?? {}) as Record<string, unknown>
  const fields: Record<string, unknown> = { id: crypto.randomUUID(), name, type: kind }
  for (const key of VIEW_FIELDS[kind]) fields[key] = changes[key] ?? active[key]
  fields.aggregates = changes.aggregates ?? active.aggregates ?? []
  fields.grouping = changes.grouping ?? active.grouping ?? []
  const view = fields as unknown as ViewOf<K>
  const group = groupOf(persisted, kind)
  return { persisted: withGroup(persisted, kind, { activeViewId: view.id, views: [...group.views, view] }), view }
}

/** Removes a view (never the default one); the last remaining view becomes active. */
export function removeView(persisted: PersistedViewState, kind: ViewKind, id: string): PersistedViewState | null {
  if (id === DEFAULT_VIEW_ID[kind]) return null
  const remaining = groupOf(persisted, kind).views.filter((v) => v.id !== id)
  return withGroup(persisted, kind, { activeViewId: remaining.at(-1)?.id ?? DEFAULT_VIEW_ID[kind], views: remaining })
}

export function renameView(persisted: PersistedViewState, kind: ViewKind, id: string, name: string): PersistedViewState {
  const group = groupOf(persisted, kind)
  return withGroup(persisted, kind, { ...group, views: group.views.map((v) => (v.id === id ? { ...v, name } : v)) })
}

/** Puts a view's saved sorting, filters, totals and grouping back into the feature stores (discarding changes). */
export function restoreViewStores(tableId: string, view: ViewRecord | undefined) {
  if (!view) return
  getSortingStore(tableId, view.id).setState({ sorting: view.sorting })
  getFilteringStore(tableId, view.id).setState({ rules: view.filters })
  getAggregatesStore(tableId, view.id).setState({ rules: view.aggregates ?? [] })
  getGroupingStore(tableId, view.id).setState({ grouping: view.grouping ?? [] })
}

/** The built-in default views a table starts with. */
export function makeDefaultState(
  defaultViewName: string,
  initialColumnVisibility: VisibilityState,
  initialListColumnVisibility: VisibilityState,
  initialAggregates: AggregateRule[] = [],
  initialGrouping: GroupByRule[] = [],
  defaults?: ResolvedViewDefaults
): PersistedViewState {
  const table = defaults?.table
  const list = defaults?.list
  return {
    tableViews: {
      activeViewId: DEFAULT_TABLE_VIEW_ID,
      views: [
        {
          id: DEFAULT_TABLE_VIEW_ID,
          name: defaultViewName,
          type: "table",
          columnVisibility: initialColumnVisibility,
          columnSizing: table?.columnSizing ?? {},
          columnOrder: table?.columnOrder ?? [],
          columnPinning: table?.columnPinning ?? { left: [] },
          sorting: table?.sorting ?? [],
          filters: table?.filters ?? [],
          aggregates: initialAggregates,
          grouping: initialGrouping,
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
          listColumnOrder: list?.listColumnOrder ?? [],
          sorting: list?.sorting ?? [],
          filters: list?.filters ?? [],
          aggregates: initialAggregates,
          grouping: initialGrouping,
        },
      ],
    },
  }
}
