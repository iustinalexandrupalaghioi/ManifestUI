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
import type { AggregateRule } from "../../features/aggregates/aggregates";
import {
  aggregateResultKey,
  formatAggregateLabel,
} from "../../features/aggregates/aggregates";
import type { GroupAggregateRow } from "../../features/grouping/grouping";
import { lookupGroupAggregate } from "../../features/grouping/grouping";

interface DataTableGroupTotalsRowProps<TData> {
  row: Row<TData>;
  table: Table<TData>;
  groupAggregateRules: AggregateRule[];
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
  groupAggregateRules,
  groupAggregateLookup,
  isGroupAggregatesFetching,
  dataIndex,
  measureRef,
}: DataTableGroupTotalsRowProps<TData>) {
  const t = useTranslations("Aggregates");

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

        const rule = groupAggregateRules.find((r) => r.columnId === col.id);

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
            {rule &&
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
              ))}
          </CustomTableCell>
        );
      })}
    </CustomTableRow>
  );
}
