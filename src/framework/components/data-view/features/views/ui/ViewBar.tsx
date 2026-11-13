import { useDataViewCore } from "../../../core/stores/DataViewProvider";
import { useActiveMode } from "../../../core/stores/ViewModeStore";
import { viewsFeature } from "../views.feature";
import { useActiveListView, useActiveTableView } from "../views.store";
import { ListViewBar } from "./ListViewBar";
import { TableViewBar } from "./TableViewBar";

export function ViewBar() {
  const { tableId, featureIds } = useDataViewCore();

  const activeMode = useActiveMode(tableId);

  const tableViewsApi = viewsFeature.useTableViewsApi(tableId);
  const listViewsApi = viewsFeature.useListViewsApi(tableId);

  const activeTableView = useActiveTableView(tableId);
  const activeListView = useActiveListView(tableId);

  if (!featureIds.has("views")) {
    const name =
      activeMode === "list" ? activeListView?.name : activeTableView?.name;
    return (
      <p className="min-w-0 flex-1 truncate text-lg font-medium text-primary">
        {name}
      </p>
    );
  }

  if (activeMode === "list") {
    return (
      <ListViewBar
        viewsApi={listViewsApi}
        tableId={tableId}
        viewId={activeListView.id}
      />
    );
  }

  return (
    <TableViewBar
      viewsApi={tableViewsApi}
      tableId={tableId}
      viewId={activeTableView.id}
    />
  );
}
