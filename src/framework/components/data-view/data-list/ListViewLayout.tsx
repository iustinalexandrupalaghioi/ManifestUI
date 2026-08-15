"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SearchIcon, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { type RefObject, useMemo, useState } from "react";
import type { SortingState, Table as TTable } from "@tanstack/react-table";
import type { DataViewFeature } from "../core/contracts";
import { useCoreStore } from "../core/stores/DataViewStore";
import { ColumnManagerButton } from "../core/ui/ColumnManagerButton";
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
import { getViewsStore } from "../features/views/views.store";
import { DataList } from "./DataList";
import { useDataList } from "./useDataList";

interface ListViewLayoutProps {
  tableId: string;
  listViewId: string;
  table: TTable<any>;
  isLoading: boolean;
  quickSearchEnabled: boolean;
  enrichedPreFilters: FilterRule[];
  filterableColumns: FilterableColumn[];
  features: DataViewFeature[];
  loadMoreRef: RefObject<HTMLDivElement | null>;
  scrollContainerRef: RefObject<HTMLDivElement | null>;
  handleScroll: () => void;
  height?: number;
  isLookup?: boolean;
}

export function ListViewLayout({
  tableId,
  listViewId,
  table,
  isLoading,
  quickSearchEnabled,
  enrichedPreFilters,
  filterableColumns,
  features,
  loadMoreRef,
  scrollContainerRef,
  handleScroll,
  height,
  isLookup,
}: ListViewLayoutProps) {
  const t = useTranslations("DataView");
  const [searchOpen, setSearchOpen] = useState(false);
  const [sortPanelOpen, setSortPanelOpen] = useState(false);

  const globalFilter = useCoreStore(tableId, (s) => s.globalFilter);
  const setGlobalFilter = useCoreStore(tableId, (s) => s.setGlobalFilter);

  const list = useDataList(tableId, table);

  const sorting = table.getState().sorting;
  const sortableColumns = useMemo(() => buildSortableColumns(table), [table]);
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

  return (
    <>
      {/* ── filters + search + cols ── */}
      <div className="mb-2 flex justify-between">
        <div className="flex items-center gap-1">
          <FilterButton
            viewId={listViewId}
            tableId={tableId}
            onOpen={listFiltering.openPanel}
          />

          <SortButton sorting={sorting} onOpen={() => setSortPanelOpen(true)} />
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

      {/* ── Scroll container ── */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="scrollbar-thumb-rounded scrollbar-thin overflow-x-auto overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80"
        style={{ height: height || undefined }}
      >
        <DataList
          table={table}
          isLoading={isLoading}
          list={list}
          isLookup={isLookup}
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

        {features.map((f) => f.Panel && <f.Panel key={f.id} />)}

        <div
          ref={loadMoreRef}
          className="flex h-10 items-center justify-center"
        />
      </div>
    </>
  );
}
