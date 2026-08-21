"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type RefObject, useMemo, useRef, useState } from "react";
import type { SortingState, Table as TTable } from "@tanstack/react-table";
import { cn } from "@/framework/lib/utils";
import type { DataViewFeature } from "../core/contracts";
import { useAvailableHeight } from "../core/hooks/useAvailableHeight";
import { useCoreStore } from "../core/stores/DataViewStore";
import { ColumnManagerButton } from "../core/ui/ColumnManagerButton";
import { DataListModeToggle } from "./ui/DataListModeToggle";
import { getFilteringStore } from "../features/filtering/filtering.store";
import type {
  FilterableColumn,
  FilterRule,
} from "../features/filtering/filters";
import { FilterButton } from "../features/filtering/ui/FilterButton";
import { FilterChips } from "../features/filtering/ui/FilterChips";
import { FilterPanel } from "../features/filtering/ui/FilterPanel";
import { getSelectionStore } from "../features/selection";
import { getSortingStore } from "../features/sorting/sorting.store";
import { buildSortableColumns } from "../features/sorting/useSortableColumns";
import { SortButton } from "../features/sorting/ui/SortButton";
import { SortPanel } from "../features/sorting/ui/SortPanel";
import { getAggregatesStore } from "../features/aggregates/aggregates.store";
import { buildAggregatableColumns } from "../features/aggregates/useAggregatableColumns";
import { TotalsButton } from "../features/aggregates/ui/TotalsButton";
import { TotalsPanel } from "../features/aggregates/ui/TotalsPanel";
import { ListSummaryBar, useSummaryPosition } from "./ui/ListSummaryBar";
import type {
  AggregateRule,
  AggregateResult,
} from "../features/aggregates/aggregates";
import { getGroupingStore } from "../features/grouping/grouping.store";
import { buildGroupableColumns } from "../features/grouping/useGroupableColumns";
import { GroupByButton } from "../features/grouping/ui/GroupByButton";
import { GroupByPanel } from "../features/grouping/ui/GroupByPanel";
import { buildGroupAggregateLookup } from "../features/grouping/grouping";
import type { GroupAggregateRow, GroupByRule } from "../features/grouping/grouping";
import { getViewsStore } from "../features/views/views.store";
import { DataList } from "./DataList";
import { useDataList } from "./useDataList";

interface ListViewLayoutProps {
  tableId: string;
  listViewId: string;
  table: TTable<any>;
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
  isLookup?: boolean;
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
  isLoading,
  activeRowId,
  openOnRowClick,
  quickSearchEnabled,
  enrichedPreFilters,
  filterableColumns,
  features,
  loadMoreRef,
  scrollContainerRef,
  handleScroll,
  height,
  isLookup,
  hasListMode,
  aggregateValues,
  isAggregatesFetching,
  groupAggregateRows,
  isGroupAggregatesFetching,
}: ListViewLayoutProps) {
  const t = useTranslations("DataView");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortPanelOpen, setSortPanelOpen] = useState(false);
  const {
    position,
    setPosition,
    collapsed,
    toggleCollapsed,
    size,
    setSize,
    isMobile,
  } = useSummaryPosition();

  const globalFilter = useCoreStore(tableId, (s) => s.globalFilter);
  const setGlobalFilter = useCoreStore(tableId, (s) => s.setGlobalFilter);

  const list = useDataList(tableId, table);

  const sorting = table.getState().sorting;
  const sortableColumns = useMemo(() => buildSortableColumns(table), [table]);
  const aggregatableColumns = useMemo(
    () => buildAggregatableColumns(table),
    [table],
  );
  const groupableColumns = useMemo(
    () => buildGroupableColumns(table),
    [table],
  );
  const setSorting = (next: SortingState) => {
    getSortingStore(tableId, listViewId).getState().setSorting(next);
    getViewsStore(tableId).getState().updateListDraft({ sorting: next });
  };

  const listFiltering = {
    rules: getFilteringStore(tableId, listViewId)((s) => s.rules),
    panelOpen: getFilteringStore(tableId, listViewId)((s) => s.panelOpen),
    focusColumnId: getFilteringStore(
      tableId,
      listViewId,
    )((s) => s.focusColumnId),
    setRules: (rules: FilterRule[]) => {
      getFilteringStore(tableId, listViewId).getState().setRules(rules);
      getViewsStore(tableId).getState().updateListDraft({ filters: rules });
      getSelectionStore(tableId).getState().setRowSelection({});
    },
    openPanel: (columnId?: string) =>
      getFilteringStore(tableId, listViewId).getState().openPanel(columnId),
    closePanel: () =>
      getFilteringStore(tableId, listViewId).getState().closePanel(),
  };

  const listAggregates = {
    rules: getAggregatesStore(tableId, listViewId)((s) => s.rules),
    panelOpen: getAggregatesStore(tableId, listViewId)((s) => s.panelOpen),
    focusColumnId: getAggregatesStore(
      tableId,
      listViewId,
    )((s) => s.focusColumnId),
    setRules: (rules: AggregateRule[]) => {
      getAggregatesStore(tableId, listViewId).getState().setRules(rules);
      getViewsStore(tableId).getState().updateListDraft({ aggregates: rules });
    },
    openPanel: (columnId?: string) =>
      getAggregatesStore(tableId, listViewId).getState().openPanel(columnId),
    closePanel: () =>
      getAggregatesStore(tableId, listViewId).getState().closePanel(),
  };

  const listGrouping = {
    grouping: getGroupingStore(tableId, listViewId)((s) => s.grouping),
    panelOpen: getGroupingStore(tableId, listViewId)((s) => s.panelOpen),
    setGrouping: (grouping: GroupByRule[]) => {
      getGroupingStore(tableId, listViewId).getState().setGrouping(grouping);
      getViewsStore(tableId).getState().updateListDraft({ grouping });
    },
    openPanel: () => getGroupingStore(tableId, listViewId).getState().openPanel(),
    closePanel: () => getGroupingStore(tableId, listViewId).getState().closePanel(),
  };

  // Per-group-level gating (GroupByRule.showTotals) is applied at render
  // time (DataListGrid), not here — this is just "is there anything to
  // total at all".
  const groupAggregateRules = listAggregates.rules;

  const groupAggregateLookup = useMemo(
    () => buildGroupAggregateLookup(groupAggregateRows ?? [], listGrouping.grouping),
    [groupAggregateRows, listGrouping.grouping],
  );

  const hasAggregates = listAggregates.rules.length > 0 && !isLookup;

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
          <FilterButton
            viewId={listViewId}
            tableId={tableId}
            onOpen={listFiltering.openPanel}
          />

          <SortButton sorting={sorting} onOpen={() => setSortPanelOpen(true)} />
          <TotalsButton
            rules={listAggregates.rules}
            onOpen={() => listAggregates.openPanel()}
          />
          <GroupByButton
            grouping={listGrouping.grouping}
            onOpen={() => listGrouping.openPanel()}
          />
          <ColumnManagerButton type="list" />
          {quickSearchEnabled && (
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => {
                setSearchOpen((v) => !v);
                if (searchOpen) setGlobalFilter("");
              }}
            >
              <SearchIcon className="h-4 w-4" />
            </Button>
          )}
        </div>
        <DataListModeToggle tableId={tableId} hasList={hasListMode} />
      </div>

      {/* ── filter chips ── */}
      {listFiltering.rules.length > 0 && (
        <div className="mb-2">
          <FilterChips
            filters={listFiltering.rules}
            onRemove={(columnId) =>
              listFiltering.setRules(
                listFiltering.rules.filter((r) => r.columnId !== columnId),
              )
            }
            onClearAll={() => listFiltering.setRules([])}
            onOpenFilter={listFiltering.openPanel}
          />
        </div>
      )}

      {/* ── quick search ── */}
      {quickSearchEnabled && searchOpen && (
        <div className="relative mb-2">
          <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <SearchIcon className="h-4 w-4 text-muted-foreground" />
          </span>
          <Input
            autoFocus
            placeholder={t("quickSearch")}
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pr-8 pl-10"
          />
          {globalFilter && (
            <button
              type="button"
              onClick={() => setGlobalFilter("")}
              className="absolute inset-y-0 right-0 flex items-center pr-2"
            >
              <X className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </button>
          )}
        </div>
      )}

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
            isLoading={isLoading}
            activeRowId={activeRowId}
            openOnRowClick={openOnRowClick}
            list={list}
            isLookup={isLookup}
            grouping={listGrouping.grouping}
            groupAggregateRules={groupAggregateRules}
            groupAggregateLookup={groupAggregateLookup}
            isGroupAggregatesFetching={isGroupAggregatesFetching}
          />

          <FilterPanel
            open={listFiltering.panelOpen}
            onOpenChange={(open) =>
              open ? listFiltering.openPanel() : listFiltering.closePanel()
            }
            initialFilters={listFiltering.rules}
            filterableColumns={filterableColumns}
            focusColumnId={listFiltering.focusColumnId}
            onApply={(rules) => listFiltering.setRules(rules)}
            staticFilters={enrichedPreFilters}
          />

          <SortPanel
            open={sortPanelOpen}
            onOpenChange={setSortPanelOpen}
            initialSorting={sorting}
            sortableColumns={sortableColumns}
            onApply={setSorting}
          />

          <TotalsPanel
            open={listAggregates.panelOpen}
            onOpenChange={(open) =>
              open ? listAggregates.openPanel() : listAggregates.closePanel()
            }
            initialRules={listAggregates.rules}
            aggregatableColumns={aggregatableColumns}
            focusColumnId={listAggregates.focusColumnId}
            onApply={(rules) => listAggregates.setRules(rules)}
          />

          <GroupByPanel
            open={listGrouping.panelOpen}
            onOpenChange={(open) =>
              open ? listGrouping.openPanel() : listGrouping.closePanel()
            }
            initialGrouping={listGrouping.grouping}
            groupableColumns={groupableColumns}
            onApply={(grouping) => listGrouping.setGrouping(grouping)}
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
