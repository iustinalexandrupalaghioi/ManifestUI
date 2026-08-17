"use client";

import { useBrowserNavigation } from "@/framework/components/screen/stores/useBrowserNavigationStore";
import { type RefObject, useMemo } from "react";
import type { DataViewFeature } from "../../core/contracts";
import {
  useDataViewCore,
  useDataViewLayout,
} from "../../core/stores/DataViewProvider";
import { useActiveMode } from "../../core/stores/ViewModeStore";
import { ListViewLayout } from "../../data-list/ListViewLayout";
import { TableViewLayout } from "../../data-table/TableViewLayout";
import type { FilterInput, FilterRule } from "../../features/filtering/filters";
import { buildFilterableColumns } from "../../features/filtering/useFiltering";
import { SelectionToolbar } from "../../features/selection";
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
  isLookup?: boolean;
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
  isLookup,
}: DataViewLayoutProps) {
  const { table, tableId, scrollContainerRef, handleScroll, staticColumnIds } =
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
    <div id={tableId} className="w-full overflow-hidden ps-2">
      {/* ── Row 1: ViewBar + popout | counter ── */}
      <div className="mb-2 flex items-start justify-between  gap-2">
        <div className="flex min-w-0 items-start gap-2">
          {features.map((f) => f.Toolbar && <f.Toolbar key={f.id} />)}
          <div className="flex items-center gap-1 empty:hidden">
            {slotId && <div id={slotId} />}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <SelectionToolbar tableId={tableId} totalCount={totalCount} />
        </div>
      </div>

      {isList ? (
        <ListViewLayout
          tableId={tableId}
          listViewId={listViewId}
          table={table}
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
          isLookup={isLookup}
          hasListMode={hasTable && hasList}
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
        />
      )}
    </div>
  );
}
