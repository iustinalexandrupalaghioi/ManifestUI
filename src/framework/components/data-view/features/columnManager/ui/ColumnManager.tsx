"use client";

import type { DragEndEvent } from "@dnd-kit/dom";
import { PointerActivationConstraints } from "@dnd-kit/dom";
import { move } from "@dnd-kit/helpers";
import { DragDropProvider, PointerSensor } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";
import type { Column, Table, VisibilityState } from "@tanstack/react-table";
import { GripVertical, PinIcon, XIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/framework/lib/utils";

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const SYSTEM_COLUMNS = new Set(["select", "columns", "_buffer", "group"]);

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
// Types
// ─────────────────────────────────────────────

interface ManagedColumn {
  id: string;
  name: string;
  visible: boolean;
  pinned: boolean;
}

// ─────────────────────────────────────────────
// Sortable row — table mode
// ─────────────────────────────────────────────

interface SortableColumnRowProps {
  col: ManagedColumn;
  index: number;
  onToggleVisible: (id: string) => void;
  onTogglePin: (id: string) => void;
  pinningEnabled: boolean;
}

function SortableColumnRow({
  col,
  index,
  onToggleVisible,
  onTogglePin,
  pinningEnabled,
}: SortableColumnRowProps) {
  const t = useTranslations("ColumnManager");
  const { ref, isDragging } = useSortable({ id: col.id, index });

  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-md px-1 transition-colors",
        isDragging
          ? "z-50 bg-accent opacity-80 shadow-md"
          : "hover:bg-muted/50",
      )}
    >
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />

      <Checkbox
        id={`col-vis-${col.id}`}
        checked={col.visible}
        onCheckedChange={() => onToggleVisible(col.id)}
        aria-label={t("toggleVisibility", { name: col.name })}
      />

      <label
        htmlFor={`col-vis-${col.id}`}
        className="flex-1 cursor-pointer text-sm select-none"
      >
        {col.name}
      </label>

      {pinningEnabled ? (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0"
          onClick={() => onTogglePin(col.id)}
          aria-label={
            col.pinned
              ? t("unpinNamed", { name: col.name })
              : t("pinNamed", { name: col.name })
          }
          title={col.pinned ? t("unpinColumn") : t("pinColumnLeft")}
        >
          <PinIcon
            className={cn(
              "h-3.5 w-3.5",
              col.pinned ? "text-primary" : "text-muted-foreground",
            )}
          />
        </Button>
      ) : (
        <span className="h-7 w-7 shrink-0" />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────
// Sortable row — list mode (drag + visibility, no pin)
// ─────────────────────────────────────────────

interface ListColumnRowProps {
  col: ManagedColumn;
  index: number;
  onToggleVisible: (id: string) => void;
}

function ListColumnRow({ col, index, onToggleVisible }: ListColumnRowProps) {
  const t = useTranslations("ColumnManager");
  const { ref, isDragging } = useSortable({ id: col.id, index });

  return (
    <div
      ref={ref}
      className={cn(
        "flex min-h-11 items-center gap-2 rounded-md px-1 transition-colors",
        isDragging
          ? "z-50 bg-accent opacity-80 shadow-md"
          : "hover:bg-muted/50",
      )}
    >
      <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />

      <Checkbox
        id={`col-vis-${col.id}`}
        checked={col.visible}
        onCheckedChange={() => onToggleVisible(col.id)}
        aria-label={t("toggleVisibility", { name: col.name })}
      />

      <label
        htmlFor={`col-vis-${col.id}`}
        className={cn("flex-1 cursor-pointer text-sm select-none")}
      >
        {col.name}
      </label>

      {/* Spacer where pin button would be — keeps alignment with table mode */}
      <span className="h-7 w-7 shrink-0" />
    </div>
  );
}

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function buildManagedColumns<TData>(
  table: Table<TData>,
  columnOrder: string[],
  pinnedLeft: string[],
): ManagedColumn[] {
  const allCols = table
    .getAllLeafColumns()
    .filter((c) => !SYSTEM_COLUMNS.has(c.id));

  const colMap = new Map<string, Column<TData>>(allCols.map((c) => [c.id, c]));

  const orderedIds =
    columnOrder.length > 0
      ? columnOrder.filter((id) => colMap.has(id))
      : allCols.map((c) => c.id);

  for (const col of allCols) {
    if (!orderedIds.includes(col.id)) orderedIds.push(col.id);
  }

  const pinnedSet = new Set(pinnedLeft);

  return orderedIds.map((id) => {
    const col = colMap.get(id)!;
    return {
      id,
      name: col.columnDef.meta?.columnLabel ?? id,
      visible: col.getIsVisible(),
      pinned: pinnedSet.has(id),
    };
  });
}

function buildListManagedColumns<TData>(
  table: Table<TData>,
  listColumnVisibility: VisibilityState,
  listColumnOrder: string[],
): ManagedColumn[] {
  const allCols = table
    .getAllLeafColumns()
    .filter((c) => !SYSTEM_COLUMNS.has(c.id));

  const colMap = new Map<string, Column<TData>>(allCols.map((c) => [c.id, c]));

  const orderedIds =
    listColumnOrder.length > 0
      ? [
          ...listColumnOrder.filter((id) => colMap.has(id)),
          ...allCols
            .filter((c) => !listColumnOrder.includes(c.id))
            .map((c) => c.id),
        ]
      : allCols.map((c) => c.id);

  return orderedIds.map((id) => {
    const col = colMap.get(id)!;
    return {
      id,
      name: col.columnDef.meta?.columnLabel ?? id,
      visible: listColumnVisibility[id] !== false,
      pinned: false,
    };
  });
}

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

    const pinned = cols.filter((c) => c.pinned).map((c) => c.id);
    const unpinned = cols.filter((c) => !c.pinned).map((c) => c.id);
    const order = [...pinned, ...unpinned];
    const pinning = { left: pinned };

    const currentVisibility = table.getState().columnVisibility;
    const newVisibility: Record<string, boolean> = { ...currentVisibility };
    for (const col of cols) {
      newVisibility[col.id] = col.visible;
    }

    // Single batched call instead of three separate store updates —
    // avoids three sequential full column-model rebuilds for one apply.
    onApplyTableColumns?.(order, pinning, newVisibility);

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

    const allIds = table
      .getAllLeafColumns()
      .filter((c) => !SYSTEM_COLUMNS.has(c.id))
      .map((c) => c.id);
    const resetVisibility: Record<string, boolean> = {};
    for (const id of allIds) resetVisibility[id] = true;

    onApplyTableColumns?.([], { left: [] }, resetVisibility);
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
              {cols.map((col, index) =>
                isList ? (
                  <ListColumnRow
                    key={col.id}
                    col={col}
                    index={index}
                    onToggleVisible={handleToggleVisible}
                  />
                ) : (
                  <SortableColumnRow
                    key={col.id}
                    col={col}
                    index={index}
                    onToggleVisible={handleToggleVisible}
                    onTogglePin={handleTogglePin}
                    pinningEnabled={pinningEnabled}
                  />
                ),
              )}
            </DragDropProvider>
          )}
        </div>

        <SheetFooter className="flex shrink-0 flex-row justify-between border-t px-4 py-3">
          <Button variant="ghost" size="sm" onClick={handleReset}>
            {t("resetToDefault")}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              {tc("cancel")}
            </Button>
            <Button size="sm" onClick={handleApply}>
              {t("apply")}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
