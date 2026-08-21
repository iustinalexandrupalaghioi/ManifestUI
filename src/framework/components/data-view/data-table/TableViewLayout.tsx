"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type RefObject, useMemo, useState } from "react";
import type { SortingState, Table as TTable } from "@tanstack/react-table";
import type { DataViewFeature } from "../core/contracts";
import { useCoreStore } from "../core/stores/DataViewStore";
import { DataListModeToggle } from "../data-list/ui/DataListModeToggle";
import { getFilteringStore } from "../features/filtering/filtering.store";
import type { FilterRule } from "../features/filtering/filters";
import { FilterButton } from "../features/filtering/ui/FilterButton";
import { FilterChips } from "../features/filtering/ui/FilterChips";
import { FilterPanel } from "../features/filtering/ui/FilterPanel";
import type { FilterableColumn } from "../features/filtering/filters";
import { getSelectionStore } from "../features/selection";
import { getSortingStore } from "../features/sorting/sorting.store";
import { buildSortableColumns } from "../features/sorting/useSortableColumns";
import { SortButton } from "../features/sorting/ui/SortButton";
import { SortPanel } from "../features/sorting/ui/SortPanel";
import { getAggregatesStore } from "../features/aggregates/aggregates.store";
import { buildAggregatableColumns } from "../features/aggregates/useAggregatableColumns";
import { TotalsButton } from "../features/aggregates/ui/TotalsButton";
import { TotalsPanel } from "../features/aggregates/ui/TotalsPanel";
import type {
  AggregateFunction,
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
  filterableColumns,
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
  const t = useTranslations("DataView");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortPanelOpen, setSortPanelOpen] = useState(false);

  const globalFilter = useCoreStore(tableId, (s) => s.globalFilter);
  const setGlobalFilter = useCoreStore(tableId, (s) => s.setGlobalFilter);
  const columnSizeVars = useCoreStore(tableId, (s) => s.columnSizeVars);

  const { columnVisibility, columnSizing, columnOrder } = table.getState();
  const columnPinning = table.getState().columnPinning as { left: string[] };
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
  const setSorting = (
    updater: SortingState | ((old: SortingState) => SortingState),
  ) => {
    const next = typeof updater === "function" ? updater(sorting) : updater;
    getSortingStore(tableId, tableViewId).getState().setSorting(next);
    getViewsStore(tableId).getState().updateTableDraft({ sorting: next });
  };

  const tableFiltering = {
    rules: getFilteringStore(tableId, tableViewId)((s) => s.rules),
    panelOpen: getFilteringStore(tableId, tableViewId)((s) => s.panelOpen),
    focusColumnId: getFilteringStore(
      tableId,
      tableViewId,
    )((s) => s.focusColumnId),
    setRules: (rules: FilterRule[]) => {
      getFilteringStore(tableId, tableViewId).getState().setRules(rules);
      getViewsStore(tableId).getState().updateTableDraft({ filters: rules });
      getSelectionStore(tableId).getState().setRowSelection({});
    },
    openPanel: (columnId?: string) =>
      getFilteringStore(tableId, tableViewId).getState().openPanel(columnId),
    closePanel: () =>
      getFilteringStore(tableId, tableViewId).getState().closePanel(),
  };

  const tableAggregates = {
    rules: getAggregatesStore(tableId, tableViewId)((s) => s.rules),
    panelOpen: getAggregatesStore(tableId, tableViewId)((s) => s.panelOpen),
    focusColumnId: getAggregatesStore(
      tableId,
      tableViewId,
    )((s) => s.focusColumnId),
    setRules: (rules: AggregateRule[]) => {
      getAggregatesStore(tableId, tableViewId).getState().setRules(rules);
      getViewsStore(tableId)
        .getState()
        .updateTableDraft({ aggregates: rules });
    },
    openPanel: (columnId?: string) =>
      getAggregatesStore(tableId, tableViewId).getState().openPanel(columnId),
    closePanel: () =>
      getAggregatesStore(tableId, tableViewId).getState().closePanel(),
  };

  const tableGrouping = {
    grouping: getGroupingStore(tableId, tableViewId)((s) => s.grouping),
    panelOpen: getGroupingStore(tableId, tableViewId)((s) => s.panelOpen),
    setGrouping: (grouping: GroupByRule[]) => {
      getGroupingStore(tableId, tableViewId).getState().setGrouping(grouping);
      getViewsStore(tableId).getState().updateTableDraft({ grouping });
    },
    openPanel: () => getGroupingStore(tableId, tableViewId).getState().openPanel(),
    closePanel: () => getGroupingStore(tableId, tableViewId).getState().closePanel(),
  };

  const groupAggregateLookup = useMemo(
    () => buildGroupAggregateLookup(groupAggregateRows ?? [], tableGrouping.grouping),
    [groupAggregateRows, tableGrouping.grouping],
  );

  const handleSetColumnAggregate = (
    columnId: string,
    fn: AggregateFunction | null,
  ) => {
    const others = tableAggregates.rules.filter((r) => r.columnId !== columnId);
    if (fn === null) {
      tableAggregates.setRules(others);
      return;
    }
    const col = aggregatableColumns.find((c) => c.id === columnId);
    if (!col) return;
    tableAggregates.setRules([
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
          <FilterButton
            viewId={tableViewId}
            tableId={tableId}
            onOpen={tableFiltering.openPanel}
          />
          <SortButton sorting={sorting} onOpen={() => setSortPanelOpen(true)} />
          <TotalsButton
            rules={tableAggregates.rules}
            onOpen={() => tableAggregates.openPanel()}
          />
          <GroupByButton
            grouping={tableGrouping.grouping}
            onOpen={() => tableGrouping.openPanel()}
          />
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
      {tableFiltering.rules.length > 0 && (
        <div className="mb-2">
          <FilterChips
            filters={tableFiltering.rules}
            onRemove={(columnId) =>
              tableFiltering.setRules(
                tableFiltering.rules.filter((r) => r.columnId !== columnId),
              )
            }
            onClearAll={() => tableFiltering.setRules([])}
            onOpenFilter={tableFiltering.openPanel}
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
          onOpenFilter={tableFiltering.openPanel}
          aggregateRules={tableAggregates.rules}
          aggregateValues={aggregateValues}
          isAggregatesFetching={isAggregatesFetching}
          onSetAggregate={handleSetColumnAggregate}
          grouping={tableGrouping.grouping}
          groupAggregateLookup={groupAggregateLookup}
          isGroupAggregatesFetching={isGroupAggregatesFetching}
        />

        <FilterPanel
          open={tableFiltering.panelOpen}
          onOpenChange={(open) =>
            open ? tableFiltering.openPanel() : tableFiltering.closePanel()
          }
          initialFilters={tableFiltering.rules}
          filterableColumns={filterableColumns}
          focusColumnId={tableFiltering.focusColumnId}
          onApply={(rules) => tableFiltering.setRules(rules)}
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
          open={tableAggregates.panelOpen}
          onOpenChange={(open) =>
            open ? tableAggregates.openPanel() : tableAggregates.closePanel()
          }
          initialRules={tableAggregates.rules}
          aggregatableColumns={aggregatableColumns}
          focusColumnId={tableAggregates.focusColumnId}
          onApply={(rules) => tableAggregates.setRules(rules)}
        />

        <GroupByPanel
          open={tableGrouping.panelOpen}
          onOpenChange={(open) =>
            open ? tableGrouping.openPanel() : tableGrouping.closePanel()
          }
          initialGrouping={tableGrouping.grouping}
          groupableColumns={groupableColumns}
          aggregatableColumns={aggregatableColumns}
          onApply={(grouping) => tableGrouping.setGrouping(grouping)}
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
