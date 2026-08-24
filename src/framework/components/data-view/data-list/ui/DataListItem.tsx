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
import { ChevronDown, ChevronRight, Trash2 } from "lucide-react";
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
  const tc = useTranslations("Common");
  const { featureIds } = useDataViewCore();
  const selectionEnabled = featureIds.has("selection");
  const [pendingActions, setPendingActions] = useState<Set<number>>(new Set());
  const [deletePending, setDeletePending] = useState(false);
  const [visibleCount, setVisibleCount] = useState<number>(MAX_VISIBLE_ACTIONS);
  const stripRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const actionsMeta = row.getAllCells().find((c) => c.column.id === "columns")
    ?.column.columnDef.meta;
  const selectMeta = row.getAllCells().find((c) => c.column.id === "select")
    ?.column.columnDef.meta;

  const onOpen = actionsMeta?.onOpen;
  const onSelect = selectMeta?.onSelect ?? actionsMeta?.onSelect;
  const onDelete = actionsMeta?.onDelete;
  const isDeleteEligible = actionsMeta?.isDeleteEligible;
  const rawActions = actionsMeta?.actions?.() ?? [];

  const eligibleForDelete = onDelete
    ? isDeleteEligible
      ? [row].filter(isDeleteEligible)
      : [row]
    : [];

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
  const hasDelete = !!onDelete && eligibleForDelete.length > 0;
  const isPickup = !!onSelect;
  const hasBottomStrip = !isPickup && (eligibleActions.length > 0 || hasDelete);

  const columnGroups = useMemo(
    () => buildColumnGroups(visibleListColumns),
    [visibleListColumns],
  );

  const computeVisibleCount = useCallback(() => {
    if (!stripRef.current) return;
    const stripWidth = stripRef.current.offsetWidth;
    const deleteWidth = hasDelete ? 80 : 0;
    const available = stripWidth - deleteWidth - 8;

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
  }, [eligibleActions.length, hasDelete]);

  useEffect(() => {
    if (!stripRef.current) return;
    const observer = new ResizeObserver(computeVisibleCount);
    observer.observe(stripRef.current);
    computeVisibleCount();
    return () => observer.disconnect();
  }, [computeVisibleCount]);

  const visibleActions = eligibleActions.slice(0, visibleCount);
  const overflowActions = eligibleActions.slice(visibleCount);

  return (
    <div
      data-state={row.getIsSelected() ? "selected" : undefined}
      className={cn(
        "flex flex-col overflow-hidden rounded-lg border bg-card text-sm transition-colors hover:bg-accent/50",
        !isPickup && row.getIsSelected() && "border-primary bg-primary/5",
        !isPickup && isActive && "border-primary bg-primary/5",
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
        {!onSelect && onOpen && (
          <button
            onClick={() => onOpen([row])}
            className="flex w-10 shrink-0 cursor-pointer items-center justify-center self-stretch border-r bg-muted/30 transition-colors hover:bg-primary/10"
            aria-label={t("openRecord")}
            type="button"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        )}

        <div
          className="flex min-w-0 flex-1 flex-col gap-2 p-3 px-2"
          onClick={(e) => onRowClick?.(e, row)}
        >
          <div className="flex items-center gap-2">
            {!isPickup && selectionEnabled && (
              <div
                className="relative overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <Checkbox
                  className="shrink-0 bg-muted"
                  checked={row.getIsSelected()}
                  onCheckedChange={() => row.toggleSelected()}
                  aria-label={t("selectRow")}
                />
              </div>
            )}
            <span className="text-xs font-medium text-muted-foreground">
              #{row.id}
            </span>
          </div>

          {columnGroups.map(({ key, label, columns }) => {
            const cells = columns
              .map((col) =>
                row.getAllCells().find((c) => c.column.id === col.id),
              )
              .filter((cell): cell is NonNullable<typeof cell> => {
                if (!cell) return false;
                const value = cell.getValue();
                return value !== null && value !== undefined && value !== "";
              });

            if (cells.length === 0) return null;

            return (
              <div key={key} className="flex min-w-0 flex-col gap-0.5">
                <span className="text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  {label}
                </span>
                <span className="flex min-w-0 flex-wrap items-center gap-1 text-xs">
                  {cells.map((cell, i) => {
                    const meta = cell.column.columnDef.meta;
                    const isLast = i === cells.length - 1;
                    const inlineLabel = meta?.inlineLabel;
                    const position = meta?.labelPosition ?? "before";

                    return (
                      <span
                        key={cell.column.id}
                        className="flex min-w-0 max-w-full items-center gap-1"
                      >
                        {inlineLabel && position === "before" && (
                          <span className="shrink-0 text-muted-foreground">
                            {inlineLabel}:
                          </span>
                        )}
                        <span className="min-w-0 truncate">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </span>
                        {inlineLabel && position === "after" && (
                          <span className="shrink-0 text-muted-foreground">
                            {inlineLabel}
                          </span>
                        )}
                        {!isLast && (
                          <span className="mx-0.5 shrink-0 text-muted-foreground">
                            ·
                          </span>
                        )}
                      </span>
                    );
                  })}
                </span>
              </div>
            );
          })}

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

              {hasDelete && (
                <Button
                  variant="destructive"
                  type="button"
                  size="sm"
                  disabled={deletePending}
                  onClick={() => {
                    setDeletePending(true);
                    Promise.resolve(onDelete!(eligibleForDelete)).finally(() =>
                      setDeletePending(false),
                    );
                  }}
                  className="ml-auto"
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  {tc("delete")}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
