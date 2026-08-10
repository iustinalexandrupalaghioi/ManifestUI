"use client";

import { Checkbox } from "@/components/ui/checkbox";
import type { Table as TTable } from "@tanstack/react-table";
import { DataListGrid } from "./ui/DataListGrid";
import { DataListColumnManager } from "../core/ui/ColumnManager";
import type { DataListFeatureApi } from "./DataList.contract";
import { useState } from "react";
import { useTranslations } from "next-intl";

interface DataListProps {
  table: TTable<any>;
  isLoading: boolean;
  list: DataListFeatureApi;
  isLookup?: boolean;
}

export function DataList({ table, isLoading, list, isLookup }: DataListProps) {
  const t = useTranslations("DataView");
  const [columnManagerOpen, setColumnManagerOpen] = useState(false);
  const rows = table.getRowModel().rows;
  const hasVisibleList = list.visibleListColumns.length > 0;

  return (
    <>
      {/* Select-all bar — overview only */}
      {hasVisibleList && !isLookup && (
        <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background px-3 py-1.5">
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
          <span className="text-xs text-muted-foreground">
            {table.getIsSomeRowsSelected() || table.getIsAllRowsSelected()
              ? t("selectedCount", {
                  count: Object.keys(table.getState().rowSelection).length,
                })
              : t("itemsCount", { count: rows.length })}
          </span>
        </div>
      )}

      {/* List items */}
      <DataListGrid
        rows={rows}
        visibleListColumns={list.visibleListColumns}
        isLoading={isLoading}
      />

      {/* List column manager panel — overview only */}
      {!isLookup && (
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
