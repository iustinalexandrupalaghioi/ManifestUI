import { type Column, type Row } from "@tanstack/react-table";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import { usePersistedState } from "@/framework/lib/usePersistedState";
import { useDataViewCore } from "../../core/stores/DataViewProvider";
import { useSelection } from "../../features/selection/useSelection";
import type { GroupAggregateRow, GroupByRule } from "../../features/grouping/grouping";
import { DataListItem } from "./DataListItem";
import { DataListGroupHeader } from "./DataListGroupHeader";
import {
  DataListGroupTotals,
  type GroupSummaryPosition,
} from "./DataListGroupTotals";

type DisplayItem<TData> =
  | { kind: "row"; row: Row<TData> }
  | { kind: "totals"; row: Row<TData> };

// Same "totals attached to its group" placement as the table view's
// VirtualDataTableBody, except the shared position setting (top of each
// group's block vs. bottom, after its children/nested subgroups) decides
// where the totals entry lands — "top" is emitted right after the group's
// header; "bottom" (default) is flushed once the next row at <= its depth
// appears (or the list ends), via a stack of still-open ancestor groups.
function buildDisplayItems<TData>(
  rows: Row<TData>[],
  hasGroupTotals: boolean,
  grouping: GroupByRule[],
  position: GroupSummaryPosition,
): DisplayItem<TData>[] {
  if (!hasGroupTotals) return rows.map((row) => ({ kind: "row" as const, row }));

  const out: DisplayItem<TData>[] = [];
  const openGroups: Row<TData>[] = [];

  const showTotalsForDepth = (depth: number) =>
    grouping[depth]?.showTotals !== false;

  const flushTo = (depth: number) => {
    while (
      openGroups.length > 0 &&
      openGroups[openGroups.length - 1].depth >= depth
    ) {
      const group = openGroups.pop()!;
      if (group.getIsExpanded() && showTotalsForDepth(group.depth)) {
        out.push({ kind: "totals", row: group });
      }
    }
  };

  for (const row of rows) {
    flushTo(row.depth);
    out.push({ kind: "row", row });
    if (row.getIsGrouped()) {
      if (!showTotalsForDepth(row.depth)) continue;
      if (position === "top") {
        if (row.getIsExpanded()) out.push({ kind: "totals", row });
      } else {
        openGroups.push(row);
      }
    }
  }
  flushTo(-Infinity);

  return out;
}

function SkeletonItem() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-4">
      <div className="h-4 w-1/3 animate-pulse rounded-full bg-muted-foreground/15" />
      <div className="h-3 w-2/3 animate-pulse rounded-full bg-muted-foreground/10" />
      <div className="h-3 w-1/2 animate-pulse rounded-full bg-muted-foreground/10" />
      <div className="h-3 w-3/4 animate-pulse rounded-full bg-muted-foreground/10" />
    </div>
  );
}

export interface DataListGridProps<TData> {
  rows: Row<TData>[];
  visibleListColumns: Column<TData>[];
  isLoading: boolean;
  activeRowId?: string;
  openOnRowClick?: boolean;
  grouping: GroupByRule[];
  groupAggregateLookup: Map<string, GroupAggregateRow>;
  isGroupAggregatesFetching?: boolean;
  listViewId?: string;
}

// No scroll container — owned by DataViewLayout's shared scroll div
export function DataListGrid<TData>({
  rows,
  visibleListColumns,
  isLoading,
  activeRowId,
  openOnRowClick,
  grouping,
  groupAggregateLookup,
  isGroupAggregatesFetching,
  listViewId,
}: DataListGridProps<TData>) {
  const t = useTranslations("DataView");
  const { table, tableId } = useDataViewCore();
  const { handleRowClick } = useSelection(tableId, table, {
    openOnClick: openOnRowClick,
  });

  // Dock position is shared across every group's totals bar so they stay in
  // sync; collapsed state stays per-group row id so collapsing one group's
  // totals doesn't affect the others. Both persisted like ListSummaryBar's
  // own useSummaryPosition so they survive reloads.
  const [groupPosition, setGroupPosition] = usePersistedState<GroupSummaryPosition>(
    `dv-group-bars-position:${tableId}:${listViewId}`,
    "bottom",
  );
  const [groupCollapsed, setGroupCollapsed] = usePersistedState<
    Record<string, boolean>
  >(`dv-group-bars-collapsed:${tableId}:${listViewId}`, {});

  const displayItems = useMemo(
    () => buildDisplayItems(rows, grouping.length > 0, grouping, groupPosition),
    [rows, grouping, groupPosition],
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 p-1 @2xl:grid-cols-2 @5xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonItem key={i} />
        ))}
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        {t("noResults")}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 p-1 @2xl:grid-cols-2 @5xl:grid-cols-3">
      {displayItems.map((item) => {
        if (item.kind === "totals") {
          return (
            <DataListGroupTotals
              key={`${item.row.id}__totals`}
              row={item.row}
              grouping={grouping}
              groupAggregateLookup={groupAggregateLookup}
              isGroupAggregatesFetching={isGroupAggregatesFetching}
              position={groupPosition}
              collapsed={groupCollapsed[item.row.id] ?? false}
              onPositionChange={setGroupPosition}
              onToggleCollapsed={() =>
                setGroupCollapsed((prev) => ({
                  ...prev,
                  [item.row.id]: !(prev[item.row.id] ?? false),
                }))
              }
            />
          );
        }
        const row = item.row;
        return row.getIsGrouped() ? (
          <DataListGroupHeader key={row.id} row={row} table={table} />
        ) : (
          <DataListItem
            key={row.id}
            row={row}
            visibleListColumns={visibleListColumns}
            onRowClick={handleRowClick}
            isActive={row.id === activeRowId}
          />
        );
      })}
    </div>
  );
}
