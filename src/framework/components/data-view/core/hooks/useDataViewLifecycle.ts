import type { Table } from "@tanstack/react-table";
import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import { deleteAggregatesStores } from "../../features/aggregates/aggregates.store";
import { deleteEditingStore } from "../../features/editing/editing.store";
import { deleteFilteringStores } from "../../features/filtering/filtering.store";
import { deleteGroupingStores } from "../../features/grouping/grouping.store";
import { deleteSelectionStore } from "../../features/selection/selection.store";
import { deleteSortingStores } from "../../features/sorting/sorting.store";
import type { DataViewFeature, DataViewFeatureContext } from "../contracts";
import { deleteCoreStore, getCoreStore } from "../stores/DataViewStore";
import { deleteViewModeStore } from "../stores/ViewModeStore";

/** Publishes each column's size as CSS variables (one frame after sizing or visibility changes). */
export function useColumnSizeVars<TData>(table: Table<TData>, tableId: string) {
  const rafRef = useRef<number | null>(null);
  useLayoutEffect(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const colSizes: Record<string, number> = {};
      for (const header of table.getFlatHeaders()) {
        colSizes[`--header-${header.id}-size`] = header.getSize();
        colSizes[`--col-${header.column.id}-size`] = header.column.getSize();
      }
      getCoreStore(tableId).getState().setColumnSizeVars(colSizes);
    });
  }, [table.getState().columnSizing, table.getState().columnVisibility]);
}

/**
 * Runs each feature's hook. Features are hooks, so the list must not change
 * length between renders (checked in development).
 */
export function useFeatureHooks<TData>(features: DataViewFeature[], tableId: string, table: Table<TData>) {
  const prevFeaturesLengthRef = useRef(features.length);
  if (process.env.NODE_ENV !== "production") {
    if (prevFeaturesLengthRef.current !== features.length) {
      throw new Error(
        "DataView: the features array length changed between renders. " +
          "Define features as a module-level constant, not inline or in useMemo.",
      );
    }
  }
  prevFeaturesLengthRef.current = features.length;

  const featureContext: DataViewFeatureContext<TData> = useMemo(() => ({ tableId, getTable: () => table }), [tableId]);
  for (const feature of features) {
    feature.useFeature?.(featureContext);
  }
}

/** Drops every per-table store when the data view unmounts or changes table. */
export function useDataViewStoresCleanup(tableId: string) {
  useEffect(() => {
    return () => {
      deleteCoreStore(tableId);
      deleteViewModeStore(tableId);
      deleteSelectionStore(tableId);
      deleteFilteringStores(tableId);
      deleteSortingStores(tableId);
      deleteAggregatesStores(tableId);
      deleteGroupingStores(tableId);
      deleteEditingStore(tableId);
    };
  }, [tableId]);
}
