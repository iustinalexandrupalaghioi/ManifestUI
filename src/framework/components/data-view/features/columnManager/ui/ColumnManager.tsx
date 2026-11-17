"use client";

import type { DragEndEvent } from "@dnd-kit/dom";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider, PointerSensor } from "@dnd-kit/react";
import type { Table, VisibilityState } from "@tanstack/react-table";
import { XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ColumnRow } from "./ColumnRow";
import {
  allColumnsVisible,
  buildListManagedColumns,
  buildManagedColumns,
  tableColumnsToApply,
  type ManagedColumn,
} from "./managedColumns";

const sensors = [
  PointerSensor.configure({
    activationConstraints(_event: PointerEvent) {
      return [
        new PointerActivationConstraints.Delay({ value: 100, tolerance: 10 }),
      ];
    },
  }),
];

// ─────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────

export interface DataListColumnManagerProps<TData> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  table: Table<TData>;
  columnOrder: string[];
  columnPinning: { left: string[] };
  pinningEnabled?: boolean;
  onApplyTableColumns?: (
    order: string[],
    pinning: { left: string[] },
    visibility: Record<string, boolean>,
  ) => void;
  mode?: "table" | "list";
  listColumnVisibility?: VisibilityState;
  listColumnOrder?: string[];
  defaultListColumnVisibility?: VisibilityState;
  onApplyListColumns?: (visibility: VisibilityState, order: string[]) => void;
}

/** The column manager side panel: order, show and pin the grid's columns, or order and show the cards' fields. */
export function DataListColumnManager<TData>({
  open,
  onOpenChange,
  table,
  columnOrder,
  columnPinning,
  pinningEnabled = true,
  onApplyTableColumns,
  mode = "table",
  listColumnVisibility = {},
  listColumnOrder = [],
  defaultListColumnVisibility = {},
  onApplyListColumns,
}: DataListColumnManagerProps<TData>) {
  const t = useTranslations("ColumnManager");
  const tc = useTranslations("Common");
  const [cols, setCols] = useState<ManagedColumn[]>([]);
  const isList = mode === "list";

  useEffect(() => {
    if (!open) return;
    if (isList) {
      setCols(
        buildListManagedColumns(table, listColumnVisibility, listColumnOrder),
      );
    } else {
      setCols(buildManagedColumns(table, columnOrder, columnPinning.left));
    }
  }, [
    open,
    isList,
    table,
    columnOrder,
    columnPinning,
    listColumnVisibility,
    listColumnOrder,
  ]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setCols((prev) => move(prev, event));
  }, []);

  const handleToggleVisible = useCallback((id: string) => {
    setCols((prev) =>
      prev.map((c) => (c.id === id ? { ...c, visible: !c.visible } : c)),
    );
  }, []);

  const handleTogglePin = useCallback((id: string) => {
    setCols((prev) =>
      prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c)),
    );
  }, []);

  const handleApply = useCallback(() => {
    if (isList) {
      const newVisibility: VisibilityState = {};
      for (const col of cols) {
        newVisibility[col.id] = col.visible;
      }
      onApplyListColumns?.(
        newVisibility,
        cols.map((c) => c.id),
      );
      onOpenChange(false);
      return;
    }

    const { order, pinning, visibility } = tableColumnsToApply(cols, table.getState().columnVisibility);
    // Single batched call instead of three separate store updates —
    // avoids three sequential full column-model rebuilds for one apply.
    onApplyTableColumns?.(order, pinning, visibility);

    onOpenChange(false);
  }, [
    isList,
    cols,
    onApplyListColumns,
    onApplyTableColumns,
    table,
    onOpenChange,
  ]);

  const handleReset = useCallback(() => {
    if (isList) {
      onApplyListColumns?.(defaultListColumnVisibility, []);
      onOpenChange(false);
      return;
    }

    onApplyTableColumns?.([], { left: [] }, allColumnsVisible(table));
    onOpenChange(false);
  }, [
    isList,
    table,
    defaultListColumnVisibility,
    onApplyListColumns,
    onApplyTableColumns,
    onOpenChange,
  ]);
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        side="right"
        className="flex w-80 flex-col gap-0 p-0"
      >
        <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
          <div className="flex flex-col gap-0.5">
            <SheetTitle className="text-sm font-medium">
              {isList ? t("listColumns") : t("manageColumns")}
            </SheetTitle>
          </div>
          <SheetDescription className="hidden">
            {isList
              ? t("listColumnsDescription")
              : t("manageColumnsDescription")}
          </SheetDescription>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <XIcon className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="scrollbar-thumb-rounded scrollbar-thin flex-1 overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80">
          {cols.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              {t("noConfigurableColumns")}
            </p>
          ) : (
            <DragDropProvider sensors={sensors} onDragEnd={handleDragEnd}>
              {cols.map((col, index) => (
                <ColumnRow
                  key={col.id}
                  col={col}
                  index={index}
                  onToggleVisible={handleToggleVisible}
                  onTogglePin={!isList && pinningEnabled ? handleTogglePin : undefined}
                />
              ))}
            </DragDropProvider>
          )}
        </div>

        <SheetFooter className="shrink-0 flex-col gap-2 border-t px-4 py-3">
          <Button size="sm" className="w-full" onClick={handleApply}>
            {t("apply")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={handleReset}
          >
            {t("resetToDefault")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => onOpenChange(false)}
          >
            {tc("cancel")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
