import type { TableViewRecord, ListViewRecord } from "./views.types"

/**
 * ViewsFeatureApi
 *
 * The public surface of the views feature exposed to view components.
 * Split into table and list halves — each view component only receives
 * the half it needs.
 */
export interface TableViewsApi {
  views: TableViewRecord[]
  activeView: TableViewRecord
  hasChanges: boolean
  switchView(id: string): void
  saveChanges(): void
  discardChanges(): void
  saveAsView(name: string): void
  deleteView(id: string): void
  renameView(id: string, name: string): void
}

export interface ListViewsApi {
  views: ListViewRecord[]
  activeView: ListViewRecord
  hasChanges: boolean
  switchView(id: string): void
  saveChanges(): void
  discardChanges(): void
  saveAsView(name: string): void
  deleteView(id: string): void
  renameView(id: string, name: string): void
}
