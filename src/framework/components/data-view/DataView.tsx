"use client";
import "./core/tanstack-augmentations";
import { DataViewProvider } from "./core/stores/DataViewProvider";
import { useDataView, type DataViewProps } from "./core/hooks/useDataView";
import { DataViewLayout } from "./core/layout/DataViewLayout";
import type { DataViewFeature } from "./core/contracts";
import { DEFAULT_FEATURES } from "./core/features/catalog";

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
        activeRowId={props.activeRowId}
        openOnRowClick={props.openOnRowClick}
        quickSearchEnabled={props.quickSearchEnabled ?? true}
        slotId={props.slotId}
        preFilters={props.preFilters ?? []}
        hasTable={props.initialColumnVisibility !== undefined}
        hasList={props.initialListColumnVisibility !== undefined}
        loadMoreRef={loadMoreRef}
        isLookup={isLookup}
        aggregateValues={props.aggregateValues}
        isAggregatesFetching={props.isAggregatesFetching}
        groupAggregateRows={props.groupAggregateRows}
        isGroupAggregatesFetching={props.isGroupAggregatesFetching}
      />
    </DataViewProvider>
  );
}

export { DEFAULT_FEATURES };
export default DataView;
