"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/framework/lib/utils";
import {
  Clipboard,
  ExternalLink,
  FilterX,
  Link,
  ListFilter,
  Settings,
  Trash2,
} from "lucide-react";
import { memo, useEffect, useState, type RefObject } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { useDataViewCore } from "../stores/DataViewProvider";
import type { ContextMenuState, ResolvedAction } from "../types";
import type { FilterRule } from "../../features/filtering/filters";
import { formatTime } from "@/framework/lib/date-time-formatters";

interface CellContextMenuProps<TData> {
  state: ContextMenuState<TData> | null;
  onClose: () => void;
  selectedCellValuesRef: RefObject<() => string>;
  allSelectedIds: string[];
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function dispatchFilterEvent(rule: FilterRule, tableId: string) {
  window.dispatchEvent(
    new CustomEvent(`datatable:apply-filter:${tableId}`, { detail: { rule } }),
  );
}

function buildFilterRule(
  state: ContextMenuState<unknown>,
  operator: "equals" | "not_equals",
): FilterRule | null {
  const { columnId, columnType, columnName, columnLabel, copyValue, origin } =
    state;

  if (!columnType) return null;
  if (copyValue === null || copyValue === undefined || copyValue === "")
    return null;

  if (columnType === "boolean") {
    const boolOperator =
      copyValue === true || copyValue === "true"
        ? operator === "equals"
          ? "is_true"
          : "is_false"
        : operator === "equals"
          ? "is_false"
          : "is_true";

    return {
      columnId,
      columnType,
      columnName,
      columnLabel,
      operator: boolOperator,
      value: null,
      origin,
    };
  }

  let filterValue = String(copyValue);
  if (columnType === "datetime") {
    filterValue = filterValue.slice(0, 19);
  }
  if (columnType === "time") {
    filterValue = formatTime(filterValue);
  }

  return {
    columnId,
    columnType,
    columnName,
    columnLabel,
    operator,
    value: filterValue,
    origin,
  };
}

// ─────────────────────────────────────────────
// CellContextMenu
// ─────────────────────────────────────────────

function CellContextMenuInner<TData>({
  state,
  onClose,
  selectedCellValuesRef,
  allSelectedIds,
}: CellContextMenuProps<TData>) {
  const t = useTranslations("ContextMenu");
  const tc = useTranslations("Common");
  const { tableId, staticColumnIds } = useDataViewCore();
  const [open, setOpen] = useState(false);

  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 640px)");
    setIsNarrow(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setIsNarrow(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (state) setOpen(true);
  }, [state]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) onClose();
  };

  if (!state) return null;

  const {
    x,
    y,
    copyValue,
    copyUrl,
    effectiveRows,
    isMulti,
    onOpen,
    deleteAction,
    actions,
  } = state;

  const handleCopyValue = () => {
    const tsv = selectedCellValuesRef.current?.();
    if (tsv) {
      navigator.clipboard.writeText(tsv);
      return;
    }

    if (isMulti) {
      navigator.clipboard.writeText(allSelectedIds.join("\n"));
      return;
    }

    if (copyValue == null) return;
    const text =
      typeof copyValue === "boolean"
        ? copyValue
          ? tc("yes")
          : tc("no")
        : String(copyValue);
    navigator.clipboard.writeText(text);
  };

  const isStaticColumn = staticColumnIds.current.has(state.columnId);

  const filterRule =
    !isMulti && state.canFilter !== false && !isStaticColumn
      ? buildFilterRule(state as ContextMenuState<unknown>, "equals")
      : null;
  const excludeRule =
    !isMulti && state.canFilter !== false && !isStaticColumn
      ? buildFilterRule(state as ContextMenuState<unknown>, "not_equals")
      : null;
  const hasFilterActions = !!filterRule || !!excludeRule;

  const hasActions = actions.length > 0;
  const hasMidSection = hasActions || !!deleteAction;

  const countEligibleActions = (actions: ResolvedAction[]) => {
    return actions.reduce((count, action) => {
      return action.disabled ? count : count + 1;
    }, 0);
  };

  return createPortal(
    <DropdownMenu open={open} onOpenChange={handleOpenChange} modal={false}>
      <DropdownMenuTrigger asChild>
        <div
          style={{
            position: "fixed",
            left: x,
            top: y,
            width: 0,
            height: 0,
            padding: 0,
            border: "none",
            background: "transparent",
            outline: "none",
            pointerEvents: "none",
          }}
        />
      </DropdownMenuTrigger>

      <DropdownMenuContent
        className="w-fit"
        align="start"
        sideOffset={2}
        alignOffset={-4}
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* ── Open ── */}
        {onOpen && (
          <>
            <DropdownMenuItem onSelect={() => onOpen(effectiveRows)}>
              <ExternalLink className="h-4 w-4" />
              {isMulti
                ? t("openCount", { count: effectiveRows.length })
                : t("open")}
            </DropdownMenuItem>
          </>
        )}
        {/* ── Actions submenu ── */}

        {hasActions &&
          (isNarrow ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
              {actions.map((action, i) => {
                const isEligible = !action.disabled;
                if (isEligible)
                  return (
                    <DropdownMenuItem
                      key={i}
                      disabled={action.disabled}
                      onSelect={action.onSelect}
                      className={cn(
                        action.destructive &&
                          "text-destructive focus:text-destructive",
                      )}
                    >
                      {action.label}
                    </DropdownMenuItem>
                  );
              })}
            </>
          ) : (
            <DropdownMenuSub>
              <DropdownMenuSubTrigger
                className={cn(
                  countEligibleActions(actions) === 0 &&
                    "text-muted-foreground",
                )}
                disabled={countEligibleActions(actions) === 0}
              >
                <Settings className="h-4 w-4" />
                {t("actions")}
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {actions.map((action, i) => {
                  const isEligible = !action.disabled;
                  if (isEligible)
                    return (
                      <DropdownMenuItem
                        key={i}
                        disabled={action.disabled}
                        onSelect={action.onSelect}
                        className={cn(
                          action.destructive &&
                            "text-destructive focus:text-destructive",
                        )}
                      >
                        {action.label}
                      </DropdownMenuItem>
                    );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          ))}
        {/* ── Delete ── */}
        {deleteAction && (
          <DropdownMenuItem
            disabled={deleteAction.disabled}
            onSelect={deleteAction.onSelect}
          >
            <Trash2 className="h-4 w-4" />
            {deleteAction.label}
          </DropdownMenuItem>
        )}
        {/* ── Filter actions ── */}
        {hasFilterActions && (
          <>
            <DropdownMenuSeparator />
            {filterRule && (
              <DropdownMenuItem
                onSelect={() => dispatchFilterEvent(filterRule, tableId)}
              >
                <ListFilter className="h-4 w-4" />
                {t("filterByValue")}
              </DropdownMenuItem>
            )}
            {excludeRule && (
              <DropdownMenuItem
                onSelect={() => dispatchFilterEvent(excludeRule, tableId)}
              >
                <FilterX className="h-4 w-4" />
                {t("excludeValue")}
              </DropdownMenuItem>
            )}
          </>
        )}
        {/* ── Separator before actions / delete ── */}
        {hasMidSection && <DropdownMenuSeparator />}
        {/* ── Copy cell value ── */}
        <DropdownMenuItem
          onSelect={handleCopyValue}
          disabled={copyValue == null}
        >
          <Clipboard className="h-4 w-4" />
          {t("copyToClipboard")}
        </DropdownMenuItem>
        {/* ── Copy link ── */}
        {copyUrl && (
          <DropdownMenuItem
            onSelect={() => {
              if (isMulti) {
                const urls = effectiveRows
                  .map((row) => {
                    const col = Object.values(row.getAllCells()).find(
                      (c) => c.column.columnDef.meta?.getRowUrl,
                    );
                    return col?.column.columnDef.meta?.getRowUrl?.(row);
                  })
                  .filter(Boolean)
                  .join("\n");
                navigator.clipboard.writeText(urls);
              } else {
                navigator.clipboard.writeText(copyUrl);
              }
            }}
          >
            <Link className="h-4 w-4" />
            {isMulti
              ? t("copyLinksCount", { count: effectiveRows.length })
              : t("copyLink")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>,
    document.body,
  );
}

export const CellContextMenu = memo(
  CellContextMenuInner,
) as typeof CellContextMenuInner;
