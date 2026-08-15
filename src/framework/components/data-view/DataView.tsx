"use client";
import "./core/tanstack-augmentations";
import { DataViewProvider } from "./core/stores/DataViewProvider";
import { useDataView, type DataViewProps } from "./core/hooks/useDataView";
import { DataViewLayout } from "./core/layout/DataViewLayout";
import type { DataViewFeature } from "./core/contracts";

import { viewsFeature } from "./features/views/views.feature";
import { sortingFeature } from "./features/sorting/sorting.feature";
import { selectionFeature } from "./features/selection/selection.feature";
import { filteringFeature } from "./features/filtering/filtering.feature";
import { listFeature } from "./data-list/DataList.feature";

// Module-level constant — never inline. The registry loop calls hooks;
const DEFAULT_FEATURES: DataViewFeature[] = [
  viewsFeature,
  sortingFeature,
  selectionFeature,
  filteringFeature,
  listFeature,
];

interface DataViewWithFeaturesProps<TData, TValue> extends DataViewProps<
  TData,
  TValue
> {
  features?: DataViewFeature[];
  isLookup?: boolean;
}

function DataView<TData, TValue>({
  features = DEFAULT_FEATURES,
  isLookup,
  ...props
}: DataViewWithFeaturesProps<TData, TValue>) {
  const { coreCtx, layoutCtx, loadMoreRef } = useDataView(props, features);

  return (
    <DataViewProvider core={coreCtx} layout={layoutCtx}>
      <DataViewLayout
        features={features}
        totalCount={props.totalCount}
        isLoading={props.isLoading}
        rowSelection={props.rowSelection}
        quickSearchEnabled={props.quickSearchEnabled ?? true}
        slotId={props.slotId}
        preFilters={props.preFilters ?? []}
        hasTable={props.initialColumnVisibility !== undefined}
        hasList={props.initialListColumnVisibility !== undefined}
        loadMoreRef={loadMoreRef}
        isLookup={isLookup}
      />
    </DataViewProvider>
  );
}

export { DEFAULT_FEATURES };
export default DataView;
