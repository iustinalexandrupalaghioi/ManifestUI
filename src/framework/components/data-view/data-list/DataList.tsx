"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { Table as TTable } from "@tanstack/react-table";
import { useDataViewCore } from "../core/stores/DataViewProvider";
import { DataListGrid } from "./ui/DataListGrid";
import { DataListColumnManager } from "../features/columnManager/ui/ColumnManager";
import type { DataListFeatureApi } from "./DataList.contract";
import { useState } from "react";
import { useTranslations } from "next-intl";
import type {
  GroupAggregateRow,
  GroupByRule,
} from "../features/grouping/grouping";

interface DataListProps {
  table: TTable<any>;
  totalCount: number;
  isLoading: boolean;
  activeRowId?: string;
  openOnRowClick?: boolean;
  list: DataListFeatureApi;
  isPickup?: boolean;
  grouping?: GroupByRule[];
  groupAggregateLookup?: Map<string, GroupAggregateRow>;
  isGroupAggregatesFetching?: boolean;
  listViewId?: string;
}

export function DataList({
  table,
  totalCount,
  isLoading,
  activeRowId,
  openOnRowClick,
  list,
  isPickup,
  grouping = [],
  groupAggregateLookup = new Map(),
  isGroupAggregatesFetching,
  listViewId,
}: DataListProps) {
  const t = useTranslations("DataView");
  const { featureIds } = useDataViewCore();
  const selectionEnabled = featureIds.has("selection");
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const rows = table.getRowModel().rows;
  const hasVisibleList = list.visibleListColumns.length > 0;

  return (
    <>
      {/* Select-all bar — overview only */}
      {hasVisibleList && !isPickup && (
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-3 py-1.5">
          {selectionEnabled && (
            <div className="relative overflow-hidden">
              <Checkbox
                checked={
                  table.getIsAllRowsSelected()
                    ? true
                    : table.getIsSomeRowsSelected()
                      ? "indeterminate"
                      : false
                }
                onCheckedChange={(checked) =>
                  table.toggleAllRowsSelected(!!checked)
                }
                aria-label={t("selectAll")}
              />
            </div>
          )}
          <span className="text-xs text-muted-foreground">
            {selectionEnabled &&
            (table.getIsSomeRowsSelected() || table.getIsAllRowsSelected())
              ? t("selectedCount", {
                  count: Object.keys(table.getState().rowSelection).length,
                })
              : t("itemsCount", { count: totalCount })}
          </span>
        </div>
      )}

      {/* List items */}
      <DataListGrid
        rows={rows}
        visibleListColumns={list.visibleListColumns}
        isLoading={isLoading}
        activeRowId={activeRowId}
        openOnRowClick={openOnRowClick}
        grouping={grouping}
        groupAggregateLookup={groupAggregateLookup}
        isGroupAggregatesFetching={isGroupAggregatesFetching}
        listViewId={listViewId}
      />

      {/* List column manager panel — overview only */}
      {!isPickup && (
        <DataListColumnManager
          open={columnManagerOpen}
          onOpenChange={setColumnManagerOpen}
          table={table}
          mode="list"
          columnOrder={[]}
          columnPinning={{ left: [] }}
          listColumnVisibility={list.listColumnVisibility}
          listColumnOrder={list.listColumnOrder}
          onApplyListColumns={list.applyListColumns}
        />
      )}
    </>
  );
}
