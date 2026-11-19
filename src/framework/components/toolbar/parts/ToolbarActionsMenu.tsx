"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon, ZapIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";
import type { TableAction } from "../Toolbar";

/** How many actions apply to at least one selected row. */
export function countEligibleActions<TData>(actions: TableAction<TData>[], selectedRows: TData[]) {
  return actions.reduce((count, action) => {
    const eligible = selectedRows.filter((r) => action.isEligible?.(r) ?? true);
    return eligible.length > 0 ? count + 1 : count;
  }, 0);
}

/** "Actions ▾": the resource's custom actions for the selected records. */
export function ToolbarActionsMenu<TData>({
  actions,
  selectedRows,
  compact,
  className,
}: {
  actions: TableAction<TData>[];
  selectedRows: TData[];
  /** An icon instead of the label on phones (record toolbars). */
  compact?: boolean;
  className?: string;
}) {
  const t = useTranslations("Toolbar");
  const selectedCount = selectedRows.length;
  const disabled = selectedCount === 0 || countEligibleActions(actions, selectedRows) === 0;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled}
          aria-label={t("actions")}
          title={t("actions")}
          className={cn("h-10 sm:h-8", className)}
        >
          {compact && <ZapIcon aria-hidden className="sm:hidden" />}
          <span className={compact ? "hidden sm:inline" : undefined}>{t("actions")}</span>
          <ChevronDownIcon aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent onCloseAutoFocus={(e) => e.preventDefault()} align="start" className="w-fit">
        {actions.map((action) => {
          const eligible = selectedRows.filter((row) => action.isEligible?.(row) ?? true);
          return (
            <DropdownMenuItem
              key={action.key}
              disabled={eligible.length === 0}
              variant={action.destructive ? "destructive" : "default"}
              onSelect={() => action.onSelect(eligible)}
            >
              {action.label}
              {selectedCount > 1 && (
                <span className="ml-1 text-xs text-muted-foreground tabular-nums">
                  {eligible.length}/{selectedCount}
                </span>
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
