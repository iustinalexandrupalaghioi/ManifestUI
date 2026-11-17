"use client";

import type { ColumnDef, Table } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { getGroupingStore } from "../../features/grouping/grouping.store";
import { countLeafRows, type GroupByRule } from "../../features/grouping/grouping";
import { GroupValueDisplay } from "../../features/grouping/ui/GroupValueDisplay";
import { getViewsStore } from "../../features/views/views.store";
import { getViewModeStore } from "../stores/ViewModeStore";

/** The "Group" column: a grouped row's value, its row count, and the expand toggle. */
export function useGroupColumn<TData>(tableRef: React.RefObject<Table<TData>>): ColumnDef<TData> {
  const tGrouping = useTranslations("Grouping");
  return useMemo(
    () => ({
      id: "group",
      header: () => tGrouping("group"),
      cell: ({ row }) => {
        if (!row.getIsGrouped()) return null;
        const meta = tableRef.current?.getColumn(row.groupingColumnId!)?.columnDef.meta;
        return (
          <button
            type="button"
            className="flex h-full w-full items-center gap-1.5 text-left"
            style={{ paddingLeft: `${row.depth * 20}px` }}
            onClick={row.getToggleExpandedHandler()}
          >
            <span className="inline-flex size-4 shrink-0 items-center justify-center text-muted-foreground">
              {row.getIsExpanded() ? <ChevronDown /> : <ChevronRight />}
            </span>
            <span className="shrink-0 text-muted-foreground">{meta?.columnLabel ?? row.groupingColumnId}: </span>
            <span className="truncate font-semibold">
              <GroupValueDisplay
                value={row.getValue(row.groupingColumnId!)}
                type={meta?.columnType ?? "text"}
                options={meta?.selectOptions}
                bucket={meta?.bucket}
              />
            </span>
            <span className="shrink-0 text-muted-foreground">({countLeafRows(row)})</span>
          </button>
        );
      },
      enableSorting: false,
      enableColumnFilter: false,
      enableResizing: true,
      enableHiding: false,
      enableGrouping: false,
      size: 220,
      minSize: 140,
    }),
    [tGrouping],
  );
}

/**
 * TanStack's grouping change (column ids) turned into grouping rules for the
 * active view: existing rules keep their settings, new ones take the column's
 * meta. Saved to the active view's grouping store and its unsaved draft.
 */
export function groupingChangeHandler<TData>({
  tableId,
  grouping,
  groupingIds,
  tableRef,
  tableViewId,
  listViewId,
}: {
  tableId: string;
  grouping: GroupByRule[];
  groupingIds: string[];
  tableRef: React.RefObject<Table<TData>>;
  tableViewId: string;
  listViewId: string;
}) {
  return (updater: string[] | ((old: string[]) => string[])) => {
    const nextIds = typeof updater === "function" ? updater(groupingIds) : updater;
    const byId = new Map(grouping.map((g) => [g.columnId, g]));
    const next: GroupByRule[] = nextIds.map((id) => {
      const existing = byId.get(id);
      if (existing) return existing;
      const meta = tableRef.current?.getColumn(id)?.columnDef.meta;
      return {
        columnId: id,
        columnName: meta?.columnName ?? id,
        columnLabel: meta?.columnLabel ?? id,
        columnType: meta?.columnType ?? "text",
        ...(meta?.origin ? { origin: meta.origin } : {}),
      };
    });
    const mode = getViewModeStore(tableId).getState().activeMode;
    if (mode === "list") {
      getGroupingStore(tableId, listViewId).getState().setGrouping(next);
      getViewsStore(tableId).getState().updateListDraft({ grouping: next });
    } else {
      getGroupingStore(tableId, tableViewId).getState().setGrouping(next);
      getViewsStore(tableId).getState().updateTableDraft({ grouping: next });
    }
  };
}
