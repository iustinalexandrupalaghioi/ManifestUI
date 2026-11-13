import type { VisibilityState } from "@tanstack/react-table";
import { getViewModeStore } from "../stores/ViewModeStore";
import {
  getViewsStore,
  useActiveTableView,
  useActiveListView,
} from "../../features/views/views.store";
import { getSortingStore } from "../../features/sorting/sorting.store";
import { getGroupingStore } from "../../features/grouping/grouping.store";
import {
  DEFAULT_TABLE_VIEW_ID,
  DEFAULT_LIST_VIEW_ID,
} from "../../features/views/views.types";

const EMPTY_COLUMN_SIZING: Record<string, number> = {};
const EMPTY_COLUMN_ORDER: string[] = [];
const EMPTY_COLUMN_PINNING: { left: string[] } = { left: [] };

export function useColumnState(
  tableId: string,
  initialColumnVisibility: VisibilityState,
) {
  const activeTableView = useActiveTableView(tableId);
  const activeListView = useActiveListView(tableId);
  const tableViewId = activeTableView?.id ?? DEFAULT_TABLE_VIEW_ID;
  const listViewId = activeListView?.id ?? DEFAULT_LIST_VIEW_ID;

  const tableDraft = getViewsStore(tableId)((s) => s.tableDraft);

  const columnVisibility =
    tableDraft?.columnVisibility ??
    activeTableView?.columnVisibility ??
    initialColumnVisibility;
  const columnSizing =
    tableDraft?.columnSizing ??
    activeTableView?.columnSizing ??
    EMPTY_COLUMN_SIZING;
  const columnOrder =
    tableDraft?.columnOrder ??
    activeTableView?.columnOrder ??
    EMPTY_COLUMN_ORDER;
  const columnPinning =
    tableDraft?.columnPinning ??
    activeTableView?.columnPinning ??
    EMPTY_COLUMN_PINNING;

  const activeMode = getViewModeStore(tableId)((s) => s.activeMode);
  const tableSorting = getSortingStore(tableId, tableViewId)((s) => s.sorting);
  const listSorting = getSortingStore(tableId, listViewId)((s) => s.sorting);
  const sorting = activeMode === "list" ? listSorting : tableSorting;

  const tableGrouping = getGroupingStore(tableId, tableViewId)(
    (s) => s.grouping,
  );
  const listGrouping = getGroupingStore(tableId, listViewId)(
    (s) => s.grouping,
  );
  const grouping = activeMode === "list" ? listGrouping : tableGrouping;

  return {
    columnVisibility,
    columnSizing,
    columnOrder,
    columnPinning,
    sorting,
    grouping,
    tableViewId,
    listViewId,
    activeMode,
  };
}
