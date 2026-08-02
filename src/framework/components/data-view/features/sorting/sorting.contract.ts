import type { SortingState } from "@tanstack/react-table"

/**
 * SortingFeatureApi
 *
 * The public surface of the sorting feature. Scoped to tableId:viewId so
 * table views and list views each have fully independent sort state.
 */
export interface SortingFeatureApi {
  sorting: SortingState
  setSorting(
    updater: SortingState | ((old: SortingState) => SortingState)
  ): void
}
