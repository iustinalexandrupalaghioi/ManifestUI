import type { Row } from "@tanstack/react-table"

/**
 * SelectionFeatureApi
 *
 * The public surface of the selection feature. Both TableViewContent and
 * ListViewContent receive this — selection is shared across modes so the
 * same store instance backs both.
 */
export interface SelectionFeatureApi {
  handleRowClick(e: React.MouseEvent, row: Row<any>): void
  handleRowDoubleClick(row: Row<any>): void
  handleRowContextClick(row: Row<any>): void
  rowSelection: Record<string, boolean>
  setRowSelection(s: Record<string, boolean>): void
}
