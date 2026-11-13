"use client";

import {
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { Settings } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/framework/lib/utils";
import type { TableAction } from "../Toolbar";

export function ToolbarActionsList<TData>({
  actions,
  selectedRows,
  selectedCount,
  eligibleCount,
  isNarrow,
}: {
  actions: TableAction<TData>[];
  selectedRows: TData[];
  selectedCount: number;
  eligibleCount: number;
  isNarrow: boolean;
}) {
  const t = useTranslations("Toolbar");

  const renderItem = (action: TableAction<TData>, i: number) => {
    const eligible = selectedRows.filter(
      (r) => action.isEligible?.(r) ?? true,
    );

    if (eligible.length === 0) return null;

    return (
      <DropdownMenuItem key={i} onSelect={() => action.onSelect(eligible)}>
        {action.label}

        {selectedCount > 1 && (
          <span className="ml-1 text-muted-foreground">
            ({eligible.length}/{selectedCount})
          </span>
        )}
      </DropdownMenuItem>
    );
  };

  if (isNarrow) {
    return (
      <>
        <DropdownMenuLabel>{t("actions")}</DropdownMenuLabel>
        {actions.map(renderItem)}
      </>
    );
  }

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger
        disabled={selectedCount === 0 || eligibleCount === 0}
        className={cn(
          (selectedCount === 0 || eligibleCount === 0) &&
            "pointer-events-none opacity-50",
        )}
      >
        <Settings className="size-4" />
        {t("actions")}
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent
          className="w-fit"
          align="start"
          sideOffset={2}
          alignOffset={-4}
        >
          {actions.map(renderItem)}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </DropdownMenuSub>
  );
}
