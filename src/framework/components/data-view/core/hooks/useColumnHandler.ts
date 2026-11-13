import type {
  SortingState,
  Table,
  VisibilityState,
} from "@tanstack/react-table";
import type { RefObject } from "react";
import { getViewModeStore } from "../stores/ViewModeStore";
import { getViewsStore } from "../../features/views/views.store";
import { getSortingStore } from "../../features/sorting/sorting.store";

interface ColumnHandlerState {
  columnVisibility: VisibilityState;
  columnSizing: Record<string, number>;
  columnOrder: string[];
  columnPinning: { left: string[] };
  sorting: SortingState;
  tableViewId: string;
  listViewId: string;
}

export function useColumnHandlers<TData>(
  tableId: string,
  state: ColumnHandlerState,
  tableRef: RefObject<Table<TData>>,
) {
  const {
    columnVisibility,
    columnSizing,
    columnOrder,
    columnPinning,
    sorting,
    tableViewId,
    listViewId,
  } = state;

  return {
    onSortingChange: (
      updater: SortingState | ((old: SortingState) => SortingState),
    ) => {
      const next = typeof updater === "function" ? updater(sorting) : updater;
      const mode = getViewModeStore(tableId).getState().activeMode;
      if (mode === "list") {
        getSortingStore(tableId, listViewId).getState().setSorting(next);
        getViewsStore(tableId).getState().updateListDraft({ sorting: next });
      } else {
        getSortingStore(tableId, tableViewId).getState().setSorting(next);
        getViewsStore(tableId).getState().updateTableDraft({ sorting: next });
      }
    },

    onColumnVisibilityChange: (
      updater: VisibilityState | ((old: VisibilityState) => VisibilityState),
    ) => {
      const next =
        typeof updater === "function" ? updater(columnVisibility) : updater;
      getViewsStore(tableId)
        .getState()
        .updateTableDraft({ columnVisibility: next });
    },

    onColumnSizingChange: (
      updater:
        | Record<string, number>
        | ((old: Record<string, number>) => Record<string, number>),
    ) => {
      const next =
        typeof updater === "function" ? updater(columnSizing) : updater;
      getViewsStore(tableId)
        .getState()
        .updateTableDraft({ columnSizing: next });
    },

    onColumnOrderChange: (
      updater: string[] | ((old: string[]) => string[]),
    ) => {
      const next =
        typeof updater === "function" ? updater(columnOrder) : updater;
      getViewsStore(tableId)
        .getState()
        .updateTableDraft({
          columnOrder: next.filter(
            (id) => !["group", "select", "columns"].includes(id),
          ),
        });
    },

    onColumnPinningChange: (
      updater:
        | { left?: string[] }
        | ((old: { left?: string[] }) => { left?: string[] }),
    ) => {
      const current = { left: columnPinning.left };
      const next = typeof updater === "function" ? updater(current) : updater;
      const newPinnedIds = (next.left ?? []).filter(
        (id) => !["group", "select", "columns"].includes(id),
      );

      // Fall back to all leaf column IDs when no order has been set yet.
      // tableRef.current is always set by the time this callback fires.
      const base =
        columnOrder.length > 0
          ? columnOrder.filter(
              (id) => !["group", "select", "columns"].includes(id),
            )
          : (tableRef.current?.getAllLeafColumns() ?? [])
              .map((c) => c.id)
              .filter((id) => !["group", "select", "columns"].includes(id));

      const unpinned = base.filter((id) => !newPinnedIds.includes(id));

      getViewsStore(tableId)
        .getState()
        .updateTableDraft({
          columnPinning: { left: newPinnedIds },
          columnOrder: [...newPinnedIds, ...unpinned],
        });
    },
  };
}
