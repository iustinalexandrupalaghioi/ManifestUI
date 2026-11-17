"use client";

import { useSortable } from "@dnd-kit/react/sortable";
import { GripVertical, PinIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/framework/lib/utils";
import type { ManagedColumn } from "./managedColumns";

/**
 * One column in the column manager: drag to reorder, check to show, and pin
 * (when `onTogglePin` is given; otherwise a spacer keeps rows aligned).
 */
export function ColumnRow({
  col,
  index,
  onToggleVisible,
  onTogglePin,
}: {
  col: ManagedColumn;
  index: number;
  onToggleVisible: (id: string) => void;
  onTogglePin?: (id: string) => void;
}) {
  const t = useTranslations("ColumnManager");
  const { ref, isDragging } = useSortable({ id: col.id, index });

  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-md px-1 transition-colors",
        isDragging ? "z-50 bg-accent opacity-80 shadow-md" : "hover:bg-muted/50",
      )}
    >
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />

      <Checkbox
        id={`col-vis-${col.id}`}
        checked={col.visible}
        onCheckedChange={() => onToggleVisible(col.id)}
        aria-label={t("toggleVisibility", { name: col.name })}
      />

      <label htmlFor={`col-vis-${col.id}`} className="flex-1 cursor-pointer text-sm select-none">
        {col.name}
      </label>

      {onTogglePin ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onTogglePin(col.id)}
          aria-label={col.pinned ? t("unpinNamed", { name: col.name }) : t("pinNamed", { name: col.name })}
          title={col.pinned ? t("unpinColumn") : t("pinColumnLeft")}
        >
          <PinIcon className={cn("h-3.5 w-3.5", col.pinned ? "text-primary" : "text-muted-foreground")} />
        </Button>
      ) : (
        <span className="h-7 w-7 shrink-0" />
      )}
    </div>
  );
}
