import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import type { FieldValues } from "react-hook-form";
import { useActiveMode } from "@/framework/components/data-view/core/stores/ViewModeStore";
import { getAggregatesStore } from "@/framework/components/data-view/features/aggregates/aggregates.store";
import { getEditingStore } from "@/framework/components/data-view/features/editing/editing.store";
import type { FilterInput, FilterRule } from "@/framework/components/data-view/features/filtering";
import { toFilterRuleFallback } from "@/framework/components/data-view/features/filtering/filters";
import { getFilteringStore } from "@/framework/components/data-view/features/filtering/filtering.store";
import { unionGroupAggregateRules } from "@/framework/components/data-view/features/grouping/grouping";
import { getGroupingStore } from "@/framework/components/data-view/features/grouping/grouping.store";
import { getSortingStore } from "@/framework/components/data-view/features/sorting/sorting.store";
import { resolveViewDefaults } from "@/framework/components/data-view/features/views/viewDefaults";
import { useActiveListView, useActiveTableView } from "@/framework/components/data-view/features/views/views.store";
import { DEFAULT_LIST_VIEW_ID, DEFAULT_TABLE_VIEW_ID } from "@/framework/components/data-view/features/views/views.types";
import { usePendingChanges } from "@/framework/hooks/usePendingChanges";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { ResourceId } from "../../../types/resource-hook-types";
import type { ResourceHooks } from "../../hooks/create-resource-hooks";
import { parseUrlPreFilters } from "./parseUrlPreFilters";
import type { OverviewConfig } from "./types";
import { useOverviewViewsSync } from "./useOverviewViewsSync";

/**
 * An overview's data: its pre-filters (from props or the URL), the active
 * view's sorting, filters and grouping, and the list and aggregate queries
 * they drive. Also the grid's pending-edit guard for refreshing.
 */
export function useOverviewData<TItem, TFormValues extends FieldValues, TId extends ResourceId>({
  hooks,
  config,
  preFiltersProp,
  locale,
  canRead,
}: {
  hooks: ResourceHooks<TItem, TFormValues, TId>;
  config: OverviewConfig<TItem, TFormValues>;
  preFiltersProp?: FilterInput[];
  locale: string;
  canRead: boolean;
}) {
  const {
    createColumns,
    overviewKey,
    defaultViewName,
    columnVisibility,
    navigationColumnVisibility,
    cardNavigationColumnVisibility,
    listColumnVisibility,
    dataView,
  } = config;
  const searchParams = useSearchParams();

  const urlPreFilters = useMemo<FilterInput[]>(() => parseUrlPreFilters(searchParams), [searchParams]);
  const preFilters = preFiltersProp ?? urlPreFilters;

  const listFilter = useMemo(
    () => (preFilters.length > 0 ? Object.fromEntries(preFilters.map((f) => [f.columnName, f.value])) : undefined),
    [preFilters],
  );
  // A filtered (embedded or navigated) list keeps its own views and state.
  const tableId = listFilter ? `${overviewKey}-${JSON.stringify(listFilter)}` : overviewKey;

  const editMode = getEditingStore(tableId)((s) => s.editMode);
  const pendingEdits = getEditingStore(tableId)((s) => s.pendingEdits);
  const { guard: guardRefresh, pendingChangesDialog } = usePendingChanges(Object.keys(pendingEdits).length > 0);

  const navigationViewName = listFilter ? dataView?.overview?.navigationViewName : undefined;
  const resolvedViewName = config.getOverviewTitle?.(preFilters) ?? resolveLabel(navigationViewName ?? defaultViewName, locale);

  const tableColumnVisibility = listFilter && navigationColumnVisibility ? navigationColumnVisibility : columnVisibility;
  const cardColumnVisibility = listFilter && cardNavigationColumnVisibility ? cardNavigationColumnVisibility : listColumnVisibility;

  const viewDefaultsConfig = listFilter ? dataView?.overview?.navigationView : dataView?.overview?.defaultView;
  const viewDefaults = useMemo(
    () => (viewDefaultsConfig ? resolveViewDefaults(viewDefaultsConfig, createColumns?.(locale) ?? []) : undefined),
    [viewDefaultsConfig, locale],
  );
  useOverviewViewsSync(tableId, resolvedViewName, tableColumnVisibility ?? {}, cardColumnVisibility ?? {}, viewDefaults);

  const activeMode = useActiveMode(tableId);
  const activeTableView = useActiveTableView(tableId);
  const activeCardView = useActiveListView(tableId);
  const activeViewId =
    activeMode === "list" ? (activeCardView?.id ?? DEFAULT_LIST_VIEW_ID) : (activeTableView?.id ?? DEFAULT_TABLE_VIEW_ID);

  const sorting = getSortingStore(tableId, activeViewId)((s) => s.sorting);
  const userFilters = getFilteringStore(tableId, activeViewId)((s) => s.rules);
  const activeFilters = useMemo<FilterRule[]>(
    () => [...preFilters.map(toFilterRuleFallback), ...userFilters],
    [preFilters, userFilters],
  );

  const activeAggregateRules = getAggregatesStore(tableId, activeViewId)((s) => s.rules);
  const aggregates = hooks.useAggregates(activeAggregateRules, activeFilters);

  const activeGrouping = getGroupingStore(tableId, activeViewId)((s) => s.grouping);
  const groupAggregateRules = useMemo(() => unionGroupAggregateRules(activeGrouping), [activeGrouping]);
  const groupAggregates = hooks.useGroupAggregates(groupAggregateRules, activeFilters, activeGrouping);

  const list = hooks.useList(sorting, activeFilters, activeGrouping, canRead);

  const refresh = () =>
    guardRefresh(() => {
      getEditingStore(tableId).getState().discardAll();
      list.refetch();
      aggregates.refetch();
      groupAggregates.refetch();
    });

  return {
    preFilters,
    listFilter,
    tableId,
    resolvedViewName,
    tableColumnVisibility,
    cardColumnVisibility,
    editMode,
    pendingChangesDialog,
    sorting,
    activeFilters,
    list,
    aggregates,
    groupAggregates,
    refresh,
  };
}
