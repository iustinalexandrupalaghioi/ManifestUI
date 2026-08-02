"use client"

import { useEffect, useLayoutEffect } from "react"
import { getFilteringStore } from "../filtering/filtering.store"
import type { ViewRepository } from "../persistence/persistence.contract"
import { getSortingStore } from "../sorting/sorting.store"
import {
  getViewsStore,
  useActiveListView,
  useActiveTableView,
} from "./views.store"

function hydrateViewStores(
  tableId: string,
  persisted: import("./views.types").PersistedViewState
) {
  const { tableViews, listViews } = persisted

  const activeTableView =
    tableViews.views.find((v) => v.id === tableViews.activeViewId) ??
    tableViews.views[0]

  if (activeTableView) {
    getSortingStore(tableId, activeTableView.id).setState({
      sorting: activeTableView.sorting,
    })
    getFilteringStore(tableId, activeTableView.id).setState({
      rules: activeTableView.filters,
    })
  }

  const activeListView =
    listViews.views.find((v) => v.id === listViews.activeViewId) ??
    listViews.views[0]

  if (activeListView) {
    getSortingStore(tableId, activeListView.id).setState({
      sorting: activeListView.sorting,
    })
    getFilteringStore(tableId, activeListView.id).setState({
      rules: activeListView.filters,
    })
  }
}

const hydratedStores = new Set<string>()

export function useViews(tableId: string, repository: ViewRepository) {
  // ── Synchronous initialisation ────────────────────────────────────────────
  // Only hydrate if the store already exists with correct config.
  // Never call getViewsStore here without params — it would create a store
  // with defaults if the caller hasn't initialised it yet.
  useLayoutEffect(() => {
    if (hydratedStores.has(tableId)) return
    hydratedStores.add(tableId)
    const persisted = repository.loadSync(tableId)
    if (persisted) {
      getViewsStore(tableId).setState({ persisted })
      hydrateViewStores(tableId, persisted)
    }
  }, [tableId])

  // ── Hydrate on active table view change ──────────────────────────────────
  const activeTableView = useActiveTableView(tableId)
  useEffect(() => {
    if (!activeTableView) return
    getSortingStore(tableId, activeTableView.id).setState({
      sorting: activeTableView.sorting,
    })
    getFilteringStore(tableId, activeTableView.id).setState({
      rules: activeTableView.filters,
    })
  }, [tableId, activeTableView?.id])

  // ── Hydrate on active list view change ───────────────────────────────────
  const activeListView = useActiveListView(tableId)
  useEffect(() => {
    if (!activeListView) return
    getSortingStore(tableId, activeListView.id).setState({
      sorting: activeListView.sorting,
    })
    getFilteringStore(tableId, activeListView.id).setState({
      rules: activeListView.filters,
    })
  }, [tableId, activeListView?.id])

  // ── Persist on every committed change ────────────────────────────────────
  useEffect(() => {
    const store = getViewsStore(tableId)
    return store.subscribe(
      (s) => s.persisted,
      (persisted) => {
        repository.save(tableId, persisted)
      }
    )
  }, [tableId])

  // ── Clean up hydration flag on unmount ───────────────────────────────────
  useEffect(() => {
    return () => {
      hydratedStores.delete(tableId)
    }
  }, [tableId])
}
