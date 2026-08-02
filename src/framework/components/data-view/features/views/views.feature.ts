import { useViews } from "./useViews"
import { LocalStorageViewRepository, type ViewRepository } from "../persistence"
import type { TableViewsApi, ListViewsApi } from "./views.contract"
import {
  getViewsStore,
  useActiveTableView,
  useActiveListView,
  useTableHasChanges,
  useListHasChanges,
} from "./views.store"
import type {
  DataViewFeature,
  DataViewFeatureContext,
} from "../../core/contracts"
import { ViewBar } from "./ui/ViewBar"

/**
 * ViewsFeature
 *
 * Registration object for the views feature. Implements DataViewFeature so
 * it can be discovered through the shared registry contract.
 *
 * useTableViewsApi and useListViewsApi are kept as named methods so
 * ViewBar can consume them without importing store internals.
 */
export interface ViewsFeature extends DataViewFeature {
  id: "views"
  useTableViewsApi(tableId: string): TableViewsApi
  useListViewsApi(tableId: string): ListViewsApi
}

export function createViewsFeature(
  repository: ViewRepository = new LocalStorageViewRepository()
): ViewsFeature {
  return {
    id: "views",

    useFeature<TData>({ tableId }: DataViewFeatureContext<TData>) {
      useViews(tableId, repository)
    },

    Toolbar: ViewBar,

    useTableViewsApi(tableId: string): TableViewsApi {
      const activeView = useActiveTableView(tableId)
      const hasChanges = useTableHasChanges(tableId)
      const store = getViewsStore(tableId)
      const views = store((s) => s.persisted.tableViews.views)

      return {
        views,
        activeView,
        hasChanges,
        switchView: (id) => store.getState().switchTableView(id),
        saveChanges: () => store.getState().saveTableChanges(),
        discardChanges: () => store.getState().discardTableChanges(),
        saveAsView: (name) => store.getState().saveAsTableView(name),
        deleteView: (id) => store.getState().deleteTableView(id),
        renameView: (id, name) => store.getState().renameTableView(id, name),
      }
    },

    useListViewsApi(tableId: string): ListViewsApi {
      const activeView = useActiveListView(tableId)
      const hasChanges = useListHasChanges(tableId)
      const store = getViewsStore(tableId)
      const views = store((s) => s.persisted.listViews.views)

      return {
        views,
        activeView,
        hasChanges,
        switchView: (id) => store.getState().switchListView(id),
        saveChanges: () => store.getState().saveListChanges(),
        discardChanges: () => store.getState().discardListChanges(),
        saveAsView: (name) => store.getState().saveAsListView(name),
        deleteView: (id) => store.getState().deleteListView(id),
        renameView: (id, name) => store.getState().renameListView(id, name),
      }
    },
  }
}

export const viewsFeature = createViewsFeature()
