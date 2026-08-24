"use client";

import { type RefObject, useMemo, useRef } from "react";
import type { Table as TTable } from "@tanstack/react-table";
import { cn } from "@/framework/lib/utils";
import type { DataViewFeature } from "../core/contracts";
import { useAvailableHeight } from "../core/hooks/useAvailableHeight";
import { ColumnManagerButton } from "../features/columnManager/ui/ColumnManagerButton";
import { DataListModeToggle } from "./ui/DataListModeToggle";
import type {
  FilterableColumn,
  FilterRule,
} from "../features/filtering/filters";
import { FilterBar } from "../features/filtering/ui/FilterBar";
import { FilterChipsBar } from "../features/filtering/ui/FilterChipsBar";
import { SortBar } from "../features/sorting/ui/SortBar";
import { getAggregatesStore } from "../features/aggregates/aggregates.store";
import { TotalsBar } from "../features/aggregates/ui/TotalsBar";
import { ListSummaryBar, useSummaryPosition } from "./ui/ListSummaryBar";
import type {
  AggregateRule,
  AggregateResult,
} from "../features/aggregates/aggregates";
import { getGroupingStore } from "../features/grouping/grouping.store";
import { GroupByBar } from "../features/grouping/ui/GroupByBar";
import { buildGroupAggregateLookup } from "../features/grouping/grouping";
import type { GroupAggregateRow } from "../features/grouping/grouping";
import { QuickSearchButton } from "../features/quickSearch/ui/QuickSearchButton";
import { QuickSearchInput } from "../features/quickSearch/ui/QuickSearchInput";
import { DataList } from "./DataList";
import { useDataList } from "./useDataList";

interface ListViewLayoutProps {
  tableId: string;
  listViewId: string;
  table: TTable<any>;
  totalCount: number;
  isLoading: boolean;
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
  isPickup?: boolean;
  hasListMode: boolean;
  aggregateValues?: AggregateResult;
  isAggregatesFetching?: boolean;
  groupAggregateRows?: GroupAggregateRow[];
  isGroupAggregatesFetching?: boolean;
}

export function ListViewLayout({
  tableId,
  listViewId,
  table,
  totalCount,
  isLoading,
  activeRowId,
  openOnRowClick,
  quickSearchEnabled,
  enrichedPreFilters,
  features,
  loadMoreRef,
  scrollContainerRef,
  handleScroll,
  height,
  isPickup,
  hasListMode,
  aggregateValues,
  isAggregatesFetching,
  groupAggregateRows,
  isGroupAggregatesFetching,
}: ListViewLayoutProps) {
  const hasFeature = (id: string) => features.some((f) => f.id === id);

  const {
    position,
    setPosition,
    collapsed,
    toggleCollapsed,
    size,
    setSize,
    isMobile,
  } = useSummaryPosition(`${tableId}:${listViewId}`);

  const list = useDataList(tableId, table);

  const listAggregates = {
    rules: getAggregatesStore(tableId, listViewId)((s) => s.rules),
  };

  const grouping = getGroupingStore(tableId, listViewId)((s) => s.grouping);

  const groupAggregateLookup = useMemo(
    () => buildGroupAggregateLookup(groupAggregateRows ?? [], grouping),
    [groupAggregateRows, grouping],
  );

  const hasAggregates = listAggregates.rules.length > 0 && !isPickup;

  const wrapperRef = useRef<HTMLDivElement>(null);
  const wrapperHeight = useAvailableHeight(wrapperRef, [
    position,
    collapsed,
    size,
    hasAggregates,
  ]);

  return (
    <>
      {/* ── filters + search + cols ── */}
      <div className="mb-2 flex items-start justify-between">
        <div className="flex flex-wrap items-center gap-1">
          {hasFeature("filtering") && <FilterBar />}
          {hasFeature("sorting") && <SortBar />}
          {hasFeature("aggregates") && <TotalsBar />}
          {hasFeature("grouping") && <GroupByBar />}
          {hasFeature("columnManager") && <ColumnManagerButton type="list" />}
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

      {/* ── Scroll container + summary bar ── */}
      <div
        ref={wrapperRef}
        className={cn(
          "flex min-h-0",
          position === "left" || position === "right" ? "flex-row" : "flex-col",
        )}
        style={{ height: wrapperHeight || height || undefined }}
      >
        {hasAggregates && (position === "left" || position === "top") && (
          <ListSummaryBar
            rules={listAggregates.rules}
            values={aggregateValues}
            isFetching={isAggregatesFetching}
            position={position}
            onPositionChange={setPosition}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
            size={size}
            onSizeChange={setSize}
            isMobile={isMobile}
          />
        )}

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="@container scrollbar-thumb-rounded scrollbar-thin min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80"
        >
          <DataList
            table={table}
            totalCount={totalCount}
            isLoading={isLoading}
            activeRowId={activeRowId}
            openOnRowClick={openOnRowClick}
            list={list}
            isPickup={isPickup}
            grouping={grouping}
            groupAggregateLookup={groupAggregateLookup}
            isGroupAggregatesFetching={isGroupAggregatesFetching}
            listViewId={listViewId}
          />

          {features.map((f) => f.Panel && <f.Panel key={f.id} />)}

          <div
            ref={loadMoreRef}
            className="flex h-10 items-center justify-center"
          />
        </div>

        {hasAggregates && (position === "right" || position === "bottom") && (
          <ListSummaryBar
            rules={listAggregates.rules}
            values={aggregateValues}
            isFetching={isAggregatesFetching}
            position={position}
            onPositionChange={setPosition}
            collapsed={collapsed}
            onToggleCollapsed={toggleCollapsed}
            size={size}
            onSizeChange={setSize}
            isMobile={isMobile}
          />
        )}
      </div>
    </>
  );
}
