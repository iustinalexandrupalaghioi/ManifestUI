"use client";

import {
  CustomTableCell,
  CustomTableRow,
} from "@/framework/components/ui/CustomTable";
import { cn } from "@/framework/lib/utils";
import { Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Row, Table } from "@tanstack/react-table";
import {
  aggregateResultKey,
  formatAggregateLabel,
} from "../../features/aggregates/aggregates";
import type { GroupAggregateRow, GroupByRule } from "../../features/grouping/grouping";
import {
  countLeafRows,
  lookupGroupAggregate,
} from "../../features/grouping/grouping";

interface DataTableGroupTotalsRowProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
  grouping: GroupByRule[];
  groupAggregateLookup: Map<string, GroupAggregateRow>;
  isGroupAggregatesFetching?: boolean;
  dataIndex: number;
  measureRef: (node: HTMLTableRowElement | null) => void;
}

// One subtotal row per group header, styled like a mini DataTableFooter —
// one cell per real data column, sourced from the server-side rollup query
// rather than the loaded rows.
export function DataTableGroupTotalsRow<TData>({
  row,
  table,
  grouping,
  groupAggregateLookup,
  isGroupAggregatesFetching,
  dataIndex,
  measureRef,
}: DataTableGroupTotalsRowProps<TData>) {
  const t = useTranslations("Aggregates");
  // Each level's totals are configured independently in the Group By panel.
  const levelAggregateRules = grouping[row.depth]?.aggregates ?? [];

  const path = useMemo(() => {
    const levels: { columnId: string; value: unknown }[] = [];
    let current: Row<TData> | undefined = row;
    while (current?.getIsGrouped()) {
      levels.unshift({
        columnId: current.groupingColumnId!,
        value: current.groupingValue,
      });
      current = current.getParentRow();
    }
    return levels;
  }, [row]);

  const aggregateRow = lookupGroupAggregate(groupAggregateLookup, path);
  const leafColumns = table.getVisibleLeafColumns();
  const lastLeafColumnId = leafColumns.at(-1)?.id;

  return (
    <CustomTableRow
      data-index={dataIndex}
      ref={measureRef}
      className="select-none bg-muted/20"
    >
      {leafColumns.map((col) => {
        const isLast = col.id === lastLeafColumnId;
        const isPinned = col.getIsPinned();

        if (col.id === "group") {
          return (
            <CustomTableCell
              key={col.id}
              style={{
                position: isPinned ? "sticky" : undefined,
                left: isPinned ? col.getStart("left") : undefined,
                zIndex: isPinned ? 16 : 10,
                transform: isPinned ? "translateZ(0)" : undefined,
                paddingLeft: `${row.depth * 20 + 26}px`,
              }}
              className={cn(
                "h-0 border-b",
                isPinned ? "bg-muted" : "bg-muted/20",
                !isLast && "border-r",
              )}
            />
          );
        }

        // The column this group level is grouped on gets the row count for
        // that group by default — unless the user has also configured a
        // rule for that same column, which takes priority (e.g. grouping
        // by id but wanting avg(id) rather than just the row count).
        const rule = levelAggregateRules.find((r) => r.columnId === col.id);
        const isGroupedColumn = !rule && col.id === row.groupingColumnId;

        return (
          <CustomTableCell
            key={col.id}
            style={{
              position: isPinned ? "sticky" : undefined,
              left: isPinned ? col.getStart("left") : undefined,
              zIndex: isPinned ? 16 : 10,
              transform: isPinned ? "translateZ(0)" : undefined,
              width: isLast
                ? undefined
                : `calc(var(--col-${col.id}-size) * 1px)`,
              minWidth: isLast
                ? undefined
                : `calc(var(--col-${col.id}-size) * 1px)`,
              maxWidth: isLast
                ? undefined
                : `calc(var(--col-${col.id}-size) * 1px)`,
            }}
            className={cn(
              "h-0 overflow-hidden border-b px-3 text-xs whitespace-nowrap",
              isPinned ? "bg-muted" : "bg-muted/20",
              !isLast && "border-r",
            )}
          >
            {isGroupedColumn ? (
              `${t("fnCount")}: ${countLeafRows(row)}`
            ) : (
              rule &&
              (isGroupAggregatesFetching ? (
                <Loader2Icon className="size-3 animate-spin text-muted-foreground" />
              ) : (
                formatAggregateLabel(
                  rule,
                  aggregateRow?.[aggregateResultKey(rule)] as
                    | number
                    | null
                    | undefined,
                  t,
                )
              ))
            )}
          </CustomTableCell>
        );
      })}
    </CustomTableRow>
  );
}
