"use client";

import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { useTransitionRouter } from "@/framework/hooks/useTransitionRouter";
import { ExternalLinkIcon, FileSearch, Loader2Icon, Plus, RotateCcwIcon, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FilterInput } from "../../data-view/features/filtering";
import { useBrowserNavigation } from "../../screen/stores/useBrowserNavigationStore";
import type { TableAction } from "../Toolbar";
import { ToolbarActionsList } from "./ToolbarActionsList";

/** How many actions apply to at least one selected row. */
export function countEligibleActions<TData>(actions: TableAction<TData>[], selectedRows: TData[]) {
  return actions.reduce((count, action) => {
    const eligible = selectedRows.filter((r) => action.isEligible?.(r) ?? true);
    return eligible.length > 0 ? count + 1 : count;
  }, 0);
}

export interface ToolbarMenuItemsProps<TData> {
  selectedRows: TData[];
  selectedCount: number;
  /** Shown as the first item (the nav toolbar has no separate Open button). */
  onOpen?: (rows: TData[]) => void;
  popOutUrl?: string;
  preFilters?: FilterInput[];
  addPath?: string;
  onAdd?: () => void;
  onRefresh?: () => void;
  isRefreshing: boolean;
  isRefetching: boolean;
  actions?: TableAction<TData>[];
  isNarrow: boolean;
  onDelete?: (rows: TData[]) => void;
  isDeleteEligible?: (row: TData) => boolean;
  /** Whether a separator goes above the custom actions. */
  separateActions: boolean;
}

/** The items of a toolbar's "More" menu: open, pop out, add, refresh, custom actions, delete. */
export function ToolbarMenuItems<TData>({
  selectedRows,
  selectedCount,
  onOpen,
  popOutUrl,
  preFilters,
  addPath,
  onAdd,
  onRefresh,
  isRefreshing,
  isRefetching,
  actions,
  isNarrow,
  onDelete,
  isDeleteEligible,
  separateActions,
}: ToolbarMenuItemsProps<TData>) {
  const t = useTranslations("Toolbar");
  const tc = useTranslations("Common");
  const router = useTransitionRouter();
  const { navigateTo } = useBrowserNavigation();
  const eligibleForDelete = isDeleteEligible ? selectedRows.filter(isDeleteEligible) : selectedRows;

  return (
    <>
      {onOpen && (
        <DropdownMenuItem disabled={selectedCount === 0} onSelect={() => onOpen(selectedRows)}>
          <FileSearch className="size-4" />
          {selectedCount > 1 ? t("openCount", { count: selectedCount }) : t("open")}
        </DropdownMenuItem>
      )}

      {popOutUrl && (
        <DropdownMenuItem onClick={() => navigateTo(popOutUrl, preFilters && preFilters.length > 0 ? preFilters : undefined)}>
          <ExternalLinkIcon className="size-4" />
          {t("popout")}
        </DropdownMenuItem>
      )}

      {(addPath || onAdd) && (
        <DropdownMenuItem
          disabled={router.isPending}
          onSelect={() => {
            if (onAdd) onAdd();
            else if (addPath) router.push(addPath);
          }}
        >
          {router.isPending ? <Loader2Icon className="size-4 animate-spin" /> : <Plus className="size-4" />}
          {t("add")}
        </DropdownMenuItem>
      )}

      {onRefresh && (
        <DropdownMenuItem disabled={isRefreshing} onSelect={onRefresh}>
          {isRefetching ? <Loader2Icon className="size-4 animate-spin" /> : <RotateCcwIcon className="size-4" />}
          {t("refresh")}
        </DropdownMenuItem>
      )}

      {!!actions?.length && (
        <>
          {separateActions && <DropdownMenuSeparator />}
          <ToolbarActionsList
            actions={actions}
            selectedRows={selectedRows}
            selectedCount={selectedCount}
            eligibleCount={countEligibleActions(actions, selectedRows)}
            isNarrow={isNarrow}
          />
        </>
      )}

      {onDelete && (
        <>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={eligibleForDelete.length === 0} onSelect={() => onDelete(eligibleForDelete)}>
            <Trash2 className="size-4" />
            {tc("delete")}
            {selectedCount > 1 && (
              <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                {eligibleForDelete.length}/{selectedCount}
              </span>
            )}
          </DropdownMenuItem>
        </>
      )}
    </>
  );
}
