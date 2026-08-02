import type { Column, VisibilityState } from "@tanstack/react-table"

/**
 * ListFeatureApi
 *
 * The public surface of the list feature. Consumed by DataList
 * to drive DataListGrid and DataListColumnManager.
 */
export interface DataListFeatureApi {
  visibleListColumns: Column<any>[]
  listColumnVisibility: VisibilityState
  listColumnOrder: string[]
  applyListColumns(visibility: VisibilityState, order: string[]): void
}
