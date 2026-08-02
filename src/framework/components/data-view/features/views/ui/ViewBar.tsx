import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { useActiveMode } from "../../../core/stores/ViewModeStore"
import { viewsFeature } from "../views.feature"
import { useActiveListView, useActiveTableView } from "../views.store"
import { ListViewBar } from "./ListViewBar"
import { TableViewBar } from "./TableViewBar"

/**
 * ViewBar
 *
 * Self-contained toolbar slot for the views feature. Reads activeMode from
 * ViewModeStore and renders TableViewBar or ListViewBar accordingly.
 *
 * Sources tableId from DataViewProvider and all view APIs from viewsFeature
 * directly — no props required, so it can be registered as a Toolbar slot
 * on DataViewFeature without any threading through DataView.tsx.
 */
export function ViewBar() {
  const { tableId } = useDataViewCore()

  const activeMode = useActiveMode(tableId)

  const tableViewsApi = viewsFeature.useTableViewsApi(tableId)
  const listViewsApi = viewsFeature.useListViewsApi(tableId)

  const activeTableView = useActiveTableView(tableId)
  const activeListView = useActiveListView(tableId)

  if (activeMode === "list") {
    return (
      <ListViewBar
        viewsApi={listViewsApi}
        tableId={tableId}
        viewId={activeListView.id}
      />
    )
  }

  return (
    <TableViewBar
      viewsApi={tableViewsApi}
      tableId={tableId}
      viewId={activeTableView.id}
    />
  )
}
