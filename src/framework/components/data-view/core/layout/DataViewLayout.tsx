"use client";

import { Button } from "@/framework/components/ui/button";
import { Input } from "@/framework/components/ui/input";
import { useBrowserNavigation } from "@/framework/components/screen/stores/useBrowserNavigationStore";
import { SearchIcon, X } from "lucide-react";
import { type RefObject, useMemo, useState } from "react";
import type { DataViewFeature } from "../../core/contracts";
import {
  useDataViewCore,
  useDataViewLayout,
} from "../../core/stores/DataViewProvider";
import { useCoreStore } from "../../core/stores/DataViewStore";
import { useActiveMode } from "../../core/stores/ViewModeStore";
import { DataList } from "../../data-list/DataList";
import { DataListModeToggle } from "../../data-list/ui/DataListModeToggle";
import { useDataList } from "../../data-list/useDataList";
import { DataTable } from "../../data-table/DataTable";
import { getFilteringStore } from "../../features/filtering/filtering.store";
import type { FilterInput, FilterRule } from "../../features/filtering/filters";
import { FilterButton } from "../../features/filtering/ui/FilterButton";
import { FilterChips } from "../../features/filtering/ui/FilterChips";
import { FilterPanel } from "../../features/filtering/ui/FilterPanel";
import { buildFilterableColumns } from "../../features/filtering/useFiltering";
import { SelectionToolbar } from "../../features/selection";
import { getSortingStore } from "../../features/sorting/sorting.store";
import {
  getViewsStore,
  useActiveListView,
  useActiveTableView,
} from "../../features/views/views.store";
import {
  DEFAULT_LIST_VIEW_ID,
  DEFAULT_TABLE_VIEW_ID,
} from "../../features/views/views.types";
import { ColumnManagerButton } from "../ui/ColumnManagerButton";

interface DataViewLayoutProps {
  loadMoreRef: RefObject<HTMLDivElement | null>;
  features: DataViewFeature[];
  totalCount: number;
  isLoading: boolean;
  rowSelection: Record<string, boolean>;
  quickSearchEnabled: boolean;
  slotId?: string;
  preFilters: FilterInput[];
  hasList: boolean;
  isLookup?: boolean;
}

export function DataViewLayout({
  features,
  totalCount,
  isLoading,
  rowSelection,
  quickSearchEnabled,
  slotId,
  preFilters,
  hasList,
  loadMoreRef,
  isLookup,
}: DataViewLayoutProps) {
  const { table, tableId, scrollContainerRef, handleScroll, staticColumnIds } =
    useDataViewCore();
  const { height } = useDataViewLayout();
  const [searchOpen, setSearchOpen] = useState(false);
  const { navigateTo } = useBrowserNavigation();

  const activeMode = useActiveMode(tableId);
  const isList = activeMode === "list";

  const activeTableView = useActiveTableView(tableId);
  const activeListView = useActiveListView(tableId);
  const tableViewId = activeTableView?.id ?? DEFAULT_TABLE_VIEW_ID;
  const listViewId = activeListView?.id ?? DEFAULT_LIST_VIEW_ID;

  const globalFilter = useCoreStore(tableId, (s) => s.globalFilter);
  const setGlobalFilter = useCoreStore(tableId, (s) => s.setGlobalFilter);
  const columnSizeVars = useCoreStore(tableId, (s) => s.columnSizeVars);

  const { columnVisibility, columnSizing, columnOrder } = table.getState();
  const columnPinning = table.getState().columnPinning as { left: string[] };
  const sorting = table.getState().sorting;

  const list = useDataList(tableId, table);

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
    },
    openPanel: (columnId?: string) =>
      getFilteringStore(tableId, tableViewId).getState().openPanel(columnId),
    closePanel: () =>
      getFilteringStore(tableId, tableViewId).getState().closePanel(),
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
    },
    openPanel: (columnId?: string) =>
      getFilteringStore(tableId, listViewId).getState().openPanel(columnId),
    closePanel: () =>
      getFilteringStore(tableId, listViewId).getState().closePanel(),
  };

  const activeFiltering = isList ? listFiltering : tableFiltering;

  const filterableColumns = useMemo(
    () =>
      buildFilterableColumns(table).filter(
        (c) => !staticColumnIds.current.has(c.id),
      ),
    [table, enrichedPreFilters],
  );

  return (
    <div id={tableId} className="w-full overflow-hidden ps-2">
      {/* ── Row 1: ViewBar + popout | counter ── */}
      <div className="mb-2 flex items-start justify-between  gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {features.map((f) => f.Toolbar && <f.Toolbar key={f.id} />)}
          <div className="flex items-center gap-1 empty:hidden">
            {slotId && <div id={slotId} />}
          </div>
        </div>
        <SelectionToolbar tableId={tableId} totalCount={totalCount} />
      </div>

      {/* ── Row 3: filters + search + cols ── */}
      <div className="mb-2 flex justify-between">
        <div className="flex items-center gap-1">
          <FilterButton
            viewId={isList ? listViewId : tableViewId}
            tableId={tableId}
            onOpen={activeFiltering.openPanel}
          />
          {isList && <ColumnManagerButton type="list" />}
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

        <DataListModeToggle tableId={tableId} hasList={hasList} />
      </div>

      {/* ── filter chips ── */}
      {activeFiltering.rules.length > 0 && (
        <div className="mb-2">
          <FilterChips
            filters={activeFiltering.rules}
            onRemove={(columnId) =>
              activeFiltering.setRules(
                activeFiltering.rules.filter((r) => r.columnId !== columnId),
              )
            }
            onClearAll={() => activeFiltering.setRules([])}
            onOpenFilter={activeFiltering.openPanel}
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
            placeholder="Quick search..."
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
        {isList ? (
          <DataList
            table={table}
            isLoading={isLoading}
            list={list}
            isLookup={isLookup}
          />
        ) : (
          <DataTable
            table={table}
            isLoading={isLoading}
            rowSelection={rowSelection}
            columnVisibility={columnVisibility}
            columnSizing={columnSizing}
            columnOrder={columnOrder ?? []}
            columnPinning={{ left: columnPinning?.left ?? [] }}
            columnSizeVars={columnSizeVars}
            sorting={sorting}
            setSorting={(updater) => {
              const next =
                typeof updater === "function" ? updater(sorting) : updater;
              getSortingStore(tableId, tableViewId).getState().setSorting(next);
              getViewsStore(tableId)
                .getState()
                .updateTableDraft({ sorting: next });
            }}
            preFilters={enrichedPreFilters}
            onOpenFilter={tableFiltering.openPanel}
          />
        )}

        <FilterPanel
          open={activeFiltering.panelOpen}
          onOpenChange={(open) =>
            open ? activeFiltering.openPanel() : activeFiltering.closePanel()
          }
          initialFilters={activeFiltering.rules}
          filterableColumns={filterableColumns}
          focusColumnId={activeFiltering.focusColumnId}
          onApply={(rules) => activeFiltering.setRules(rules)}
          staticFilters={enrichedPreFilters}
        />

        {features.map((f) => f.Panel && <f.Panel key={f.id} />)}

        <div
          ref={loadMoreRef}
          className="flex h-10 items-center justify-center"
        />
      </div>
    </div>
  );
}
