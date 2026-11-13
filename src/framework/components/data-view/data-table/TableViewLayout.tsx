"use client";

import { type RefObject, useMemo } from "react";
import type { SortingState, Table as TTable } from "@tanstack/react-table";
import type { DataViewFeature } from "../core/contracts";
import { useCoreStore } from "../core/stores/DataViewStore";
import { DataListModeToggle } from "../data-list/ui/DataListModeToggle";
import { getFilteringStore } from "../features/filtering/filtering.store";
import type { FilterRule } from "../features/filtering/filters";
import { FilterBar } from "../features/filtering/ui/FilterBar";
import { FilterChipsBar } from "../features/filtering/ui/FilterChipsBar";
import type { FilterableColumn } from "../features/filtering/filters";
import { getSortingStore } from "../features/sorting/sorting.store";
import { SortBar } from "../features/sorting/ui/SortBar";
import { getAggregatesStore } from "../features/aggregates/aggregates.store";
import { buildAggregatableColumns } from "../features/aggregates/useAggregatableColumns";
import { TotalsBar } from "../features/aggregates/ui/TotalsBar";
import type {
  AggregateFunction,
  AggregateRule,
  AggregateResult,
} from "../features/aggregates/aggregates";
import { getGroupingStore } from "../features/grouping/grouping.store";
import { GroupByBar } from "../features/grouping/ui/GroupByBar";
import { buildGroupAggregateLookup } from "../features/grouping/grouping";
import type { GroupAggregateRow } from "../features/grouping/grouping";
import { QuickSearchButton } from "../features/quickSearch/ui/QuickSearchButton";
import { QuickSearchInput } from "../features/quickSearch/ui/QuickSearchInput";
import { getViewsStore } from "../features/views/views.store";
import { DataTable } from "./DataTable";

interface TableViewLayoutProps {
  tableId: string;
  tableViewId: string;
  table: TTable<any>;
  isLoading: boolean;
  rowSelection: Record<string, boolean>;
  activeRowId?: string;
  openOnRowClick?: boolean;
  quickSearchEnabled: boolean;
  enrichedPreFilters: FilterRule[];
  filterableColumns: FilterableColumn[];
  features: DataViewFeature[];
  loadMoreRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
  height?: number;
  hasListMode: boolean;
  aggregateValues?: AggregateResult;
  isAggregatesFetching?: boolean;
  groupAggregateRows?: GroupAggregateRow[];
  isGroupAggregatesFetching?: boolean;
}

export function TableViewLayout({
  tableId,
  tableViewId,
  table,
  isLoading,
  rowSelection,
  activeRowId,
  openOnRowClick,
  quickSearchEnabled,
  enrichedPreFilters,
  features,
  loadMoreRef,
  scrollContainerRef,
  handleScroll,
  height,
  hasListMode,
  aggregateValues,
  isAggregatesFetching,
  groupAggregateRows,
  isGroupAggregatesFetching,
}: TableViewLayoutProps) {
  const hasFeature = (id: string) => features.some((f) => f.id === id);

  const columnSizeVars = useCoreStore(tableId, (s) => s.columnSizeVars);

  const { columnVisibility, columnSizing, columnOrder } = table.getState();
  const columnPinning = table.getState().columnPinning as { left: string[] };
  const sorting = table.getState().sorting;
  const aggregatableColumns = useMemo(
    () => buildAggregatableColumns(table),
    [table],
  );
  const setSorting = (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    getSortingStore(tableId, tableViewId).getState().setSorting(next);
    getViewsStore(tableId).getState().updateTableDraft({ sorting: next });
  };

  const openFilterPanel = (columnId?: string) =>
    getFilteringStore(tableId, tableViewId).getState().openPanel(columnId);

  const aggregateRules = getAggregatesStore(tableId, tableViewId)(
    (s) => s.rules,
  );
  const setAggregateRules = (rules: AggregateRule[]) => {
    getAggregatesStore(tableId, tableViewId).getState().setRules(rules);
    getViewsStore(tableId).getState().updateTableDraft({ aggregates: rules });
  };

  const grouping = getGroupingStore(tableId, tableViewId)((s) => s.grouping);

  const groupAggregateLookup = useMemo(
    () => buildGroupAggregateLookup(groupAggregateRows ?? [], grouping),
    [groupAggregateRows, grouping],
  );

  const handleSetColumnAggregate = (
    columnId: string,
    fn: AggregateFunction | null,
  ) => {
    const others = aggregateRules.filter((r) => r.columnId !== columnId);
    if (fn === null) {
      setAggregateRules(others);
      return;
    }
    const col = aggregatableColumns.find((c) => c.id === columnId);
    if (!col) return;
    setAggregateRules([
      ...others,
      {
        columnId: col.id,
        columnName: col.dbName,
        columnLabel: col.name,
        columnType: col.type,
        ...(col.origin ? { origin: col.origin } : {}),
        fn,
      },
    ]);
  };

  return (
    <>
      {/* ── filters + search ── */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {hasFeature("filtering") && <FilterBar />}
          {hasFeature("sorting") && <SortBar />}
          {hasFeature("aggregates") && <TotalsBar />}
          {hasFeature("grouping") && <GroupByBar />}
          {quickSearchEnabled && hasFeature("quickSearch") && (
            <QuickSearchButton />
          )}
        </div>
        {hasFeature("viewModeToggle") && (
          <DataListModeToggle tableId={tableId} hasList={hasListMode} />
        )}
      </div>

      {/* ── filter chips ── */}
      {hasFeature("filtering") && <FilterChipsBar />}

      {/* ── quick search ── */}
      {quickSearchEnabled && hasFeature("quickSearch") && <QuickSearchInput />}

      {/* ── Scroll container ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="scrollbar-thumb-rounded scrollbar-thin overflow-x-auto overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80"
        style={{ height: height || undefined }}
      >
        <DataTable
          table={table}
          isLoading={isLoading}
          rowSelection={rowSelection}
          activeRowId={activeRowId}
          openOnRowClick={openOnRowClick}
          columnVisibility={columnVisibility}
          columnSizing={columnSizing}
          columnOrder={columnOrder ?? []}
          columnPinning={{ left: columnPinning?.left ?? [] }}
          columnSizeVars={columnSizeVars}
          sorting={sorting}
          setSorting={setSorting}
          preFilters={enrichedPreFilters}
          onOpenFilter={openFilterPanel}
          aggregateRules={aggregateRules}
          aggregateValues={aggregateValues}
          isAggregatesFetching={isAggregatesFetching}
          onSetAggregate={
            hasFeature("aggregates") ? handleSetColumnAggregate : undefined
          }
          grouping={grouping}
          groupAggregateLookup={groupAggregateLookup}
          isGroupAggregatesFetching={isGroupAggregatesFetching}
        />

        {features.map((f) => f.Panel && <f.Panel key={f.id} />)}

        <div
          ref={loadMoreRef}
          className="flex h-10 items-center justify-center"
        />
      </div>
    </>
  );
}
