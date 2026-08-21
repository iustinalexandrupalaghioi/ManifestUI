"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/framework/lib/utils";
import {
  Loader2Icon,
  PanelBottomClose,
  PanelBottomIcon,
  PanelBottomOpen,
  PanelTopClose,
  PanelTopIcon,
  PanelTopOpen,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useMemo } from "react";
import type { Row } from "@tanstack/react-table";
import {
  aggregateResultKey,
  formatAggregateLabel,
} from "../../features/aggregates/aggregates";
import type { GroupAggregateRow, GroupByRule } from "../../features/grouping/grouping";
import {
  countLeafRows,
  lookupGroupAggregate,
} from "../../features/grouping/grouping";

export type GroupSummaryPosition = "top" | "bottom";

const THIN_SCROLLBAR =
  "scrollbar-thumb-rounded scrollbar-thin scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80";

interface DataListGroupTotalsProps<TData> {
  row: Row<TData>;
  grouping: GroupByRule[];
  groupAggregateLookup: Map<string, GroupAggregateRow>;
  isGroupAggregatesFetching?: boolean;
  position: GroupSummaryPosition;
  onPositionChange: (position: GroupSummaryPosition) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

const DOCK_OPTIONS: {
  value: GroupSummaryPosition;
  icon: typeof PanelTopIcon;
}[] = [
  { value: "top", icon: PanelTopIcon },
  { value: "bottom", icon: PanelBottomIcon },
];

const COLLAPSE_ICONS = {
  top: { collapse: PanelTopClose, expand: PanelTopOpen },
  bottom: { collapse: PanelBottomClose, expand: PanelBottomOpen },
};

export function DataListGroupTotals<TData>({
  row,
  grouping,
  groupAggregateLookup,
  isGroupAggregatesFetching,
  position,
  onPositionChange,
  collapsed,
  onToggleCollapsed,
}: DataListGroupTotalsProps<TData>) {
  const t = useTranslations("Aggregates");
  // Each level's totals are configured independently in the Group By panel.
  const levelAggregateRules = grouping[row.depth]?.aggregates ?? [];
  const CollapseIcon = collapsed
    ? COLLAPSE_ICONS[position].expand
    : COLLAPSE_ICONS[position].collapse;

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

  const groupColumnLabel = useMemo(() => {
    const cell = row
      .getAllCells()
      .find((c) => c.column.id === row.groupingColumnId);
    return cell?.column.columnDef.meta?.columnLabel ?? row.groupingColumnId;
  }, [row]);

  if (collapsed) {
    return (
      <div
        className="col-span-full flex h-6 items-center justify-center border-b bg-muted/20"
        style={{ marginLeft: `${row.depth * 20 + 8}px` }}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-5"
          title={t("totals")}
          onClick={onToggleCollapsed}
        >
          <CollapseIcon className="size-3" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="col-span-full flex flex-col gap-1.5 border-b bg-muted/20 p-2"
      style={{ paddingLeft: `${row.depth * 20 + 26}px` }}
    >
      <div className="flex shrink-0 items-center justify-between gap-1">
        <span className="text-[10px] font-medium text-muted-foreground">
          {t("totals")}
        </span>
        <div className="flex items-center gap-0.5">
          {DOCK_OPTIONS.map(({ value, icon: Icon }) => (
            <Button
              key={value}
              type="button"
              variant={position === value ? "secondary" : "ghost"}
              size="icon"
              className="size-5"
              onClick={() => onPositionChange(value)}
            >
              <Icon className="size-3" />
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-5"
            title={t("collapse")}
            onClick={onToggleCollapsed}
          >
            <CollapseIcon className="size-3" />
          </Button>
        </div>
      </div>

      <div
        className={cn(
          "flex max-h-[30vh] flex-row flex-nowrap items-start gap-2 overflow-x-auto overflow-y-hidden pb-1",
          THIN_SCROLLBAR,
        )}
      >
        <div
          key="__count"
          className="shrink-0 rounded-md border bg-background px-2.5 py-1.5 text-[11px]"
        >
          <div className="whitespace-nowrap text-muted-foreground">
            {groupColumnLabel}
          </div>
          <div className="font-medium whitespace-nowrap">
            {t("fnCount")}: {countLeafRows(row)}
          </div>
        </div>

        {levelAggregateRules.map((rule) => (
          <div
            key={rule.columnId}
            className={cn(
              "shrink-0 rounded-md border bg-background py-1.5 px-2.5 text-[11px]",
            )}
          >
            <div className="whitespace-nowrap text-muted-foreground">
              {rule.columnLabel}
            </div>
            <div className="font-medium whitespace-nowrap">
              {isGroupAggregatesFetching ? (
                <Loader2Icon className="size-3 animate-spin" />
              ) : (
                formatAggregateLabel(
                  rule,
                  aggregateRow?.[aggregateResultKey(rule)] as
                    | number
                    | null
                    | undefined,
                  t,
                )
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
