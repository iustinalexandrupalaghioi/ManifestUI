import { useEffect } from "react";
import type { VisibilityState } from "@tanstack/react-table";
import { getViewsStore } from "@/framework/components/data-view/features/views/views.store";
import {
  DEFAULT_LIST_VIEW_ID,
  DEFAULT_TABLE_VIEW_ID,
} from "@/framework/components/data-view/features/views/views.types";

export function useOverviewViewsSync(
  tableId: string,
  resolvedViewName: string,
  initialColumnVisibility: VisibilityState,
  initialListColumnVisibility: VisibilityState,
) {
  getViewsStore(
    tableId,
    resolvedViewName,
    initialColumnVisibility,
    initialListColumnVisibility,
  );

  useEffect(() => {
    const store = getViewsStore(tableId);
    const { tableViews, listViews } = store.getState().persisted;
    const tableDefault = tableViews.views.find(
      (v) => v.id === DEFAULT_TABLE_VIEW_ID,
    );
    const listDefault = listViews.views.find(
      (v) => v.id === DEFAULT_LIST_VIEW_ID,
    );
    if (tableDefault && tableDefault.name !== resolvedViewName) {
      store
        .getState()
        .renameTableView(DEFAULT_TABLE_VIEW_ID, resolvedViewName);
    }
    if (listDefault && listDefault.name !== resolvedViewName) {
      store.getState().renameListView(DEFAULT_LIST_VIEW_ID, resolvedViewName);
    }
  }, [tableId, resolvedViewName]);
}
