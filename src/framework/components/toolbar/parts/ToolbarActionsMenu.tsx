"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDownIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";
import type { TableAction } from "../Toolbar";
import { countEligibleActions } from "./ToolbarMenuItems";

/** "Actions ▾": the resource's custom actions for the selected records. */
export function ToolbarActionsMenu<TData>({
  actions,
  selectedRows,
  className,
}: {
  actions: TableAction<TData>[];
  selectedRows: TData[];
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
          className={cn("h-10 sm:h-8", className)}
        >
          {t("actions")}
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
