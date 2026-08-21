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

interface GroupBarState {
  position: GroupSummaryPosition;
  collapsed: boolean;
}

const DEFAULT_GROUP_BAR_STATE: GroupBarState = {
  position: "bottom",
  collapsed: false,
};

// Same "totals attached to its group" placement as the table view's
// VirtualDataTableBody, except each group's own position choice (top of its
// block vs. bottom, after its children/nested subgroups) decides where the
// totals entry lands — a group at "top" is emitted right after its header;
// "bottom" (default) is flushed once the next row at <= its depth appears
// (or the list ends), via a stack of still-open ancestor groups.
function buildDisplayItems<TData>(
  rows: Row<TData>[],
  hasGroupTotals: boolean,
  grouping: GroupByRule[],
  getBarState: (rowId: string) => GroupBarState,
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
      const { position } = getBarState(row.id);
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

  // Per-group summary bar dock/collapse state, keyed by group row id so each
  // group's choice is independent — persisted like ListSummaryBar's own
  // useSummaryPosition so it survives reloads.
  const [groupBarState, setGroupBarState] = usePersistedState<
    Record<string, GroupBarState>
  >(`dv-group-bars:${tableId}:${listViewId}`, {});
  const getBarState = (rowId: string) =>
    groupBarState[rowId] ?? DEFAULT_GROUP_BAR_STATE;

  const displayItems = useMemo(
    () => buildDisplayItems(rows, grouping.length > 0, grouping, getBarState),
    [rows, grouping, groupBarState],
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
          const barState = getBarState(item.row.id);
          return (
            <DataListGroupTotals
              key={`${item.row.id}__totals`}
              row={item.row}
              grouping={grouping}
              groupAggregateLookup={groupAggregateLookup}
              isGroupAggregatesFetching={isGroupAggregatesFetching}
              position={barState.position}
              collapsed={barState.collapsed}
              onPositionChange={(position) =>
                setGroupBarState((prev) => ({
                  ...prev,
                  [item.row.id]: { ...getBarState(item.row.id), position },
                }))
              }
              onToggleCollapsed={() =>
                setGroupBarState((prev) => ({
                  ...prev,
                  [item.row.id]: {
                    ...getBarState(item.row.id),
                    collapsed: !getBarState(item.row.id).collapsed,
                  },
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
