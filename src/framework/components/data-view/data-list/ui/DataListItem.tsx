"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/framework/lib/utils";
import { flexRender, type Column, type Row } from "@tanstack/react-table";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useDataViewCore } from "../../core/stores/DataViewProvider";

const MAX_VISIBLE_ACTIONS = 2;
const DROPDOWN_TRIGGER_WIDTH = 48;
const ACTION_BUTTON_MIN_WIDTH = 64;

interface ColumnGroup<TData> {
  key: string;
  label: string;
  columns: Column<TData>[];
}

function buildColumnGroups<TData>(
  visibleListColumns: Column<TData>[],
): ColumnGroup<TData>[] {
  const groups: ColumnGroup<TData>[] = [];
  const seen = new Set<string>();

  for (const col of visibleListColumns) {
    const group = col.columnDef.meta?.group;
    if (group) {
      if (!seen.has(group)) {
        seen.add(group);
        const groupCols = visibleListColumns.filter(
          (c) => c.columnDef.meta?.group === group,
        );
        const groupLabel =
          groupCols.find((c) => c.columnDef.meta?.groupLabel)?.columnDef.meta
            ?.groupLabel ??
          groupCols
            .map((c) => c.columnDef.meta?.columnLabel ?? c.id)
            .join(" + ");
        groups.push({ key: group, label: groupLabel, columns: groupCols });
      }
    } else {
      groups.push({
        key: col.id,
        label: col.columnDef.meta?.columnLabel ?? col.id,
        columns: [col],
      });
    }
  }
  return groups;
}

export interface DataListItemProps<TData> {
  row: Row<TData>;
  visibleListColumns: Column<TData>[];
  onRowClick?: (e: React.MouseEvent, row: Row<TData>) => void;
  isActive?: boolean;
}

export function DataListItem<TData>({
  row,
  visibleListColumns,
  onRowClick,
  isActive,
}: DataListItemProps<TData>) {
  const t = useTranslations("DataView");
  const { featureIds } = useDataViewCore();
  const selectionEnabled = featureIds.has("selection");
  const [pendingActions, setPendingActions] = useState<Set<number>>(new Set());
  const [visibleCount, setVisibleCount] = useState<number>(MAX_VISIBLE_ACTIONS);
  const stripRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const actionsMeta = row.getAllCells().find((c) => c.column.id === "columns")
    ?.column.columnDef.meta;
  const selectMeta = row.getAllCells().find((c) => c.column.id === "select")
    ?.column.columnDef.meta;

  const onOpen = actionsMeta?.onOpen;
  const onSelect = selectMeta?.onSelect ?? actionsMeta?.onSelect;
  // Deleting is done from the toolbar (select, then Delete) or the context menu, not per card.
  const rawActions = actionsMeta?.actions?.() ?? [];

  const resolvedActions = rawActions.map((action, i) => {
    const eligible = action.isEligible
      ? [row].filter(action.isEligible)
      : [row];
    return {
      label: action.label,
      onSelect: () => {
        setPendingActions((prev) => new Set(prev).add(i));
        Promise.resolve(action.onSelect(eligible)).finally(() =>
          setPendingActions((prev) => {
            const next = new Set(prev);
            next.delete(i);
            return next;
          }),
        );
      },
      destructive: action.destructive,
      disabled: eligible.length === 0,
      index: i,
    };
  });

  const eligibleActions = resolvedActions.filter((a) => !a.disabled);
  const isPickup = !!onSelect;
  const hasBottomStrip = !isPickup && eligibleActions.length > 0;

  const columnGroups = useMemo(
    () => buildColumnGroups(visibleListColumns),
    [visibleListColumns],
  );

  const computeVisibleCount = useCallback(() => {
    if (!stripRef.current) return;
    const stripWidth = stripRef.current.offsetWidth;
    const available = stripWidth - 8;

    let used = 0;
    let count = 0;
    const hasOverflow = eligibleActions.length > MAX_VISIBLE_ACTIONS;

    for (
      let i = 0;
      i < Math.min(eligibleActions.length, MAX_VISIBLE_ACTIONS);
      i++
    ) {
      const btnWidth =
        buttonRefs.current[i]?.offsetWidth ?? ACTION_BUTTON_MIN_WIDTH;
      const overflowReserved =
        i < eligibleActions.length - 1 ? DROPDOWN_TRIGGER_WIDTH : 0;
      if (used + btnWidth + (hasOverflow ? overflowReserved : 0) <= available) {
        used += btnWidth + 4;
        count++;
      } else {
        break;
      }
    }

    setVisibleCount(count);
  }, [eligibleActions.length]);

  useEffect(() => {
    if (!stripRef.current) return;
    const observer = new ResizeObserver(computeVisibleCount);
    observer.observe(stripRef.current);
    computeVisibleCount();
    return () => observer.disconnect();
  }, [computeVisibleCount]);

  const visibleActions = eligibleActions.slice(0, visibleCount);
  const overflowActions = eligibleActions.slice(visibleCount);

  const renderCells = (columns: Column<TData>[]) => {
    const cells = columns
      .map((col) => row.getAllCells().find((c) => c.column.id === col.id))
      .filter((cell): cell is NonNullable<typeof cell> => {
        if (!cell) return false;
        const value = cell.getValue();
        return value !== null && value !== undefined && value !== "";
      });
    if (cells.length === 0) return null;
    return cells.map((cell, i) => {
      const meta = cell.column.columnDef.meta;
      return (
        <span key={cell.column.id} className="flex min-w-0 max-w-full items-center gap-1">
          {meta?.prefix && <span className="shrink-0 text-muted-foreground">{meta.prefix}</span>}
          <span className="min-w-0 truncate">{flexRender(cell.column.columnDef.cell, cell.getContext())}</span>
          {meta?.suffix && <span className="shrink-0 text-muted-foreground">{meta.suffix}</span>}
          {i < cells.length - 1 && <span className="mx-0.5 shrink-0 text-muted-foreground">·</span>}
        </span>
      );
    });
  };

  // Laid out by the list columns' config: `cardTitle` columns head the card, the rest
  // form a two-column label/value grid (`cardWide` fields span both columns).
  const isTitle = (group: ColumnGroup<TData>) => group.columns.some((col) => col.columnDef.meta?.cardTitle);
  const headingGroups = columnGroups.filter(isTitle);
  const fieldGroups = columnGroups.filter((group) => !isTitle(group));
  const highlighted = !isPickup && (row.getIsSelected() || isActive);

  return (
    <div
      data-state={row.getIsSelected() ? "selected" : undefined}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card text-sm transition-colors hover:bg-accent/50",
        highlighted && "border-link bg-selected ring-1 ring-link hover:bg-selected",
      )}
      onDoubleClick={() => isPickup && onSelect?.([row])}
    >
      <div className="flex min-w-0 h-full">
        {onSelect && (
          <button
            onClick={() => onSelect([row])}
            className="flex w-10 shrink-0 cursor-pointer items-center justify-center self-stretch border-r bg-muted/30 transition-colors hover:bg-primary/10"
            aria-label={t("selectRecord")}
            type="button"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <div
          className="flex min-w-0 flex-1 flex-col gap-3 p-3"
          onClick={(e) => onRowClick?.(e, row)}
        >
          {/* ── header: checkbox · #id · Open › ── */}
          <div className="flex items-center gap-2">
            {!isPickup && selectionEnabled && (
              <div className="relative flex" onClick={(e) => e.stopPropagation()}>
                <Checkbox
                  className="shrink-0 bg-background"
                  checked={row.getIsSelected()}
                  onCheckedChange={() => row.toggleSelected()}
                  aria-label={t("selectRow")}
                />
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground tabular-nums">#{row.id}</span>
            {!onSelect && onOpen && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpen([row]);
                }}
                className="-my-1 ml-auto inline-flex h-8 items-center gap-0.5 rounded-md px-2 text-xs font-medium text-link outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
              >
                {t("openShort")}
                <ChevronRight aria-hidden className="size-3.5" />
              </button>
            )}
          </div>

          {/* ── heading: the first column ── */}
          {headingGroups.map(({ key, label, columns }) => {
            const value = renderCells(columns);
            if (!value) return null;
            return (
              <div key={key} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="flex min-w-0 flex-wrap items-center gap-1 text-base font-semibold">{value}</span>
              </div>
            );
          })}

          {/* ── the other fields ── */}
          {fieldGroups.length > 0 && (
            <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
              {fieldGroups.map(({ key, label, columns }) => {
                const value = renderCells(columns);
                if (!value) return null;
                return (
                  <div
                    key={key}
                    className={cn(
                      "flex min-w-0 flex-col gap-0.5",
                      columns.some((col) => col.columnDef.meta?.cardWide) && "col-span-2",
                    )}
                  >
                    <dt className="truncate text-xs text-muted-foreground">{label}</dt>
                    <dd className="flex min-w-0 flex-wrap items-center gap-1 text-sm">{value}</dd>
                  </div>
                );
              })}
            </dl>
          )}

          {hasBottomStrip && (
            <div
              ref={stripRef}
              className="mt-auto flex items-center gap-1 border-t pt-2"
              onClick={(e) => e.stopPropagation()}
            >
              {visibleActions.map((action, i) => (
                <Button
                  key={action.index}
                  ref={(el) => {
                    buttonRefs.current[i] = el;
                  }}
                  size="sm"
                  type="button"
                  variant="outline"
                  disabled={pendingActions.has(action.index)}
                  onClick={action.onSelect}
                  className=""
                >
                  {action.label}
                </Button>
              ))}

              {overflowActions.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-1 px-2">
                      {t("moreCount", { count: overflowActions.length })}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-fit">
                    {overflowActions.map((action) => (
                      <DropdownMenuItem
                        key={action.index}
                        onSelect={action.onSelect}
                        disabled={pendingActions.has(action.index)}
                        className={cn(
                          action.destructive &&
                            "text-destructive focus:text-destructive",
                        )}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
