"use client";

import { useBrowserNavigation } from "@/framework/components/screen/stores/useBrowserNavigationStore";
import { type ReactNode, type RefObject, useMemo } from "react";
import { useTranslations } from "next-intl";
import { DataListModeToggle } from "../../data-list/ui/DataListModeToggle";
import { TotalsBar } from "../../features/aggregates/ui/TotalsBar";
import { ColumnManagerButton } from "../../features/columnManager/ui/ColumnManagerButton";
import { FilterBar } from "../../features/filtering/ui/FilterBar";
import { GroupByBar } from "../../features/grouping/ui/GroupByBar";
import { QuickSearchField } from "../../features/quickSearch/ui/QuickSearchField";
import { SortBar } from "../../features/sorting/ui/SortBar";
import type { DataViewFeature } from "../../core/contracts";
import { DataViewFilterProvider } from "../../core/stores/DataViewFilterContext";
import {
  useDataViewCore,
  useDataViewLayout,
} from "../../core/stores/DataViewProvider";
import { useActiveMode } from "../../core/stores/ViewModeStore";
import { ListViewLayout } from "../../data-list/ListViewLayout";
import { TableViewLayout } from "../../data-table/TableViewLayout";
import type { FilterInput, FilterRule } from "../../features/filtering/filters";
import type { AggregateResult } from "../../features/aggregates/aggregates";
import type { GroupAggregateRow } from "../../features/grouping/grouping";
import { buildFilterableColumns } from "../../features/filtering/useFiltering";
import { SelectionToolbar } from "../../features/selection";
import { ViewBar } from "../../features/views/ui/ViewBar";
import {
  useActiveListView,
  useActiveTableView,
} from "../../features/views/views.store";
import {
  DEFAULT_LIST_VIEW_ID,
  DEFAULT_TABLE_VIEW_ID,
} from "../../features/views/views.types";

interface DataViewLayoutProps {
  loadMoreRef: RefObject<HTMLDivElement | null>;
  features: DataViewFeature[];
  totalCount: number;
  isLoading: boolean;
  rowSelection: Record<string, boolean>;
  activeRowId?: string;
  openOnRowClick?: boolean;
  quickSearchEnabled: boolean;
  slotId?: string;
  preFilters: FilterInput[];
  hasTable: boolean;
  hasList: boolean;
  isPickup?: boolean;
  aggregateValues?: AggregateResult;
  isAggregatesFetching?: boolean;
  groupAggregateRows?: GroupAggregateRow[];
  isGroupAggregatesFetching?: boolean;
  /**
   * The page's action toolbar (Back, Add, Open…). Given, the list's tools join it in
   * one bar under the view row; without it (pickups, embedded lists) they keep their rows.
   */
  toolbar?: ReactNode;
}

export function DataViewLayout({
  features,
  totalCount,
  isLoading,
  rowSelection,
  activeRowId,
  openOnRowClick,
  quickSearchEnabled,
  slotId,
  preFilters,
  hasTable,
  hasList,
  loadMoreRef,
  isPickup,
  aggregateValues,
  isAggregatesFetching,
  groupAggregateRows,
  isGroupAggregatesFetching,
  toolbar,
}: DataViewLayoutProps) {
  const t = useTranslations("DataView");
  const {
    table,
    tableId,
    scrollContainerRef,
    handleScroll,
    staticColumnIds,
    featureIds,
  } =
    useDataViewCore();
  const { height } = useDataViewLayout();
  useBrowserNavigation();

  const storedMode = useActiveMode(tableId);
  const isList = hasTable && hasList ? storedMode === "list" : hasList;

  const activeTableView = useActiveTableView(tableId);
  const activeListView = useActiveListView(tableId);
  const tableViewId = activeTableView?.id ?? DEFAULT_TABLE_VIEW_ID;
  const listViewId = activeListView?.id ?? DEFAULT_LIST_VIEW_ID;

  const enrichedPreFilters = useMemo<FilterRule[]>(
    () =>
      preFilters.map((f) => {
        const col = table
          .getAllLeafColumns()
          .find((c) => (c.columnDef.meta?.columnName ?? c.id) === f.columnName);

        if (!col && process.env.NODE_ENV !== "production") {
          throw new Error(
            `[DataViewLayout] preFilters: no column found with columnName "${f.columnName}"` +
              `${f.origin ? ` (origin: "${f.origin}")` : ""}. Check your tab config — ` +
              `available columnNames: ${table
                .getAllLeafColumns()
                .map((c) => c.columnDef.meta?.columnName ?? c.id)
                .join(", ")}`,
          );
        }

        const meta = col?.columnDef?.meta;
        return {
          ...f,
          columnId: col?.id ?? f.columnName,
          columnLabel: meta?.columnLabel ?? f.columnName,
          columnType: (meta?.columnType ?? "text") as FilterRule["columnType"],
          origin: f.origin ?? meta?.origin,
          selectOptions: meta?.selectOptions,
        };
      }),
    [preFilters, table],
  );

  // update ref synchronously during render — no useEffect needed
  staticColumnIds.current = new Set(enrichedPreFilters.map((f) => f.columnId));

  const filterableColumns = useMemo(
    () =>
      buildFilterableColumns(table).filter(
        (c) => !staticColumnIds.current.has(c.id),
      ),
    [table, enrichedPreFilters],
  );

  return (
    <DataViewFilterProvider value={{ enrichedPreFilters, filterableColumns }}>
      <div id={tableId} className="w-full overflow-hidden ps-2">
        {toolbar ? (
          <>
            {/* ── Row A: the toolbar, at the top. Its parts are flex items of one bar: one line from `sm`
                 up; on phones it wraps into rows: actions · search · filters, sort, group,
                 totals (wrapping) · count and Cards | Table. ── */}
            <div
              role="toolbar"
              aria-label={t("toolbar")}
              className="mb-2 flex flex-wrap items-center gap-2 rounded-[10px] border bg-toolbar p-2"
            >
              {toolbar}
              <span aria-hidden className="order-3 hidden h-6 w-px shrink-0 bg-border sm:block" />
              {quickSearchEnabled && featureIds.has("quickSearch") && (
                <QuickSearchField className="order-3 w-full min-w-0 sm:w-56" />
              )}
              {/* 40px touch targets on phones, like the action buttons. */}
              <div className="order-4 flex w-full min-w-0 flex-wrap items-center gap-2 max-sm:[&_button]:h-10 sm:w-auto">
                {featureIds.has("filtering") && <FilterBar />}
                {featureIds.has("sorting") && <SortBar />}
                {featureIds.has("grouping") && <GroupByBar />}
                {!isList && featureIds.has("aggregates") && <TotalsBar />}
                {isList && featureIds.has("columnManager") && <ColumnManagerButton type="list" />}
              </div>
              <div className="order-8 flex w-full items-center justify-between gap-2 sm:ml-auto sm:w-auto sm:justify-end">
                {featureIds.has("selection") && (
                  <SelectionToolbar tableId={tableId} totalCount={totalCount} />
                )}
                {featureIds.has("viewModeToggle") && (
                  <DataListModeToggle tableId={tableId} hasList={hasTable && hasList} labeled />
                )}
              </div>
            </div>

            {/* ── Row B: the view (name, save, reset), under the toolbar ── */}
            <div className="mb-2 flex min-w-0 items-center gap-2">
              <ViewBar />
              {features.map((f) => f.id !== "edit" && f.Toolbar && <f.Toolbar key={f.id} />)}
            </div>
          </>
        ) : (
        /* ── Row 1: ViewBar + popout | counter ── */
        <div className="mb-2 flex items-start justify-between  gap-2">
          <div className="flex min-w-0 items-start gap-2">
            <ViewBar />
            {features.map((f) => f.Toolbar && <f.Toolbar key={f.id} />)}
            <div className="flex items-center gap-1 empty:hidden">
              {slotId && <div id={slotId} />}
            </div>
          </div>
          {featureIds.has("selection") && (
            <div className="flex items-center gap-2">
              <SelectionToolbar tableId={tableId} totalCount={totalCount} />
            </div>
          )}
        </div>
        )}

        {isList ? (
          <ListViewLayout
            tableId={tableId}
            listViewId={listViewId}
            table={table}
            totalCount={totalCount}
            isLoading={isLoading}
            activeRowId={activeRowId}
            openOnRowClick={openOnRowClick}
            quickSearchEnabled={quickSearchEnabled}
            enrichedPreFilters={enrichedPreFilters}
            filterableColumns={filterableColumns}
            features={features}
            loadMoreRef={loadMoreRef}
            scrollContainerRef={scrollContainerRef}
            handleScroll={handleScroll}
            height={height}
            isPickup={isPickup}
            hasListMode={hasTable && hasList}
            aggregateValues={aggregateValues}
            isAggregatesFetching={isAggregatesFetching}
            groupAggregateRows={groupAggregateRows}
            isGroupAggregatesFetching={isGroupAggregatesFetching}
            toolsInToolbar={!!toolbar}
          />
        ) : (
          <TableViewLayout
            tableId={tableId}
            tableViewId={tableViewId}
            table={table}
            isLoading={isLoading}
            rowSelection={rowSelection}
            activeRowId={activeRowId}
            openOnRowClick={openOnRowClick}
            quickSearchEnabled={quickSearchEnabled}
            enrichedPreFilters={enrichedPreFilters}
            filterableColumns={filterableColumns}
            features={features}
            loadMoreRef={loadMoreRef}
            scrollContainerRef={scrollContainerRef}
            handleScroll={handleScroll}
            height={height}
            hasListMode={hasTable && hasList}
            aggregateValues={aggregateValues}
            isAggregatesFetching={isAggregatesFetching}
            groupAggregateRows={groupAggregateRows}
            isGroupAggregatesFetching={isGroupAggregatesFetching}
            toolsInToolbar={!!toolbar}
          />
        )}
      </div>
    </DataViewFilterProvider>
  );
}
