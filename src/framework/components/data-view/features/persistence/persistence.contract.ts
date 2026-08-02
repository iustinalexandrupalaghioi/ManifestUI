/**
 * StorageRepository — synchronous key-value store.
 * Used by features that need storage available before first render
 * (e.g. useViews calls loadSync in the render phase to pre-populate
 * sorting and filtering stores before React Query fires).
 */
export interface StorageRepository {
  get(key: string): string | null
  set(key: string, value: string): void
}

/**
 * ViewRepository — persistence contract for named table views.
 *
 * loadSync is required alongside the async load because useViews
 * must populate sorting/filtering stores synchronously before the
 * first render — before React Query fires its initial fetch.
 * An async-only interface would force a double-fetch on every mount.
 *
 * Implement this interface to change where views are stored:
 *   - localStorage (default, via LocalStorageViewRepository)
 *   - a REST API (implement loadSync with a primed cache, save via fetch)
 *   - a test double (implement loadSync to return fixture data)
 */
export interface ViewRepository {
  loadSync(
    tableId: string
  ): import("../views/views.types").PersistedViewState | null
  load(
    tableId: string
  ): Promise<import("../views/views.types").PersistedViewState | null>
  save(
    tableId: string,
    state: import("../views/views.types").PersistedViewState
  ): Promise<void>
}
