"use client";

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
import { PlusIcon, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { GroupableColumn, GroupByRule } from "../grouping";
import type { AggregatableColumn } from "../../aggregates/aggregates";
import { draftsToGrouping, levelFromExisting, makeDraft, type DraftAggregateRule, type DraftLevel } from "./groupByDrafts";
import { LevelRow } from "./GroupLevelRow";

export interface GroupByPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGrouping: GroupByRule[];
  groupableColumns: GroupableColumn[];
  aggregatableColumns: AggregatableColumn[];
  onApply: (grouping: GroupByRule[]) => void;
}

/** The Group by side panel: edits a copy of the grouping and applies it as a whole. */
export function GroupByPanel({
  open,
  onOpenChange,
  initialGrouping,
  groupableColumns,
  aggregatableColumns,
  onApply,
}: GroupByPanelProps) {
  const t = useTranslations("Grouping");
  const tc = useTranslations("Common");
  const [drafts, setDrafts] = useState<DraftLevel[]>([]);

  useEffect(() => {
    if (!open) return;
    setDrafts(initialGrouping.map(levelFromExisting));
  }, [open]);

  const updateColumn = (key: number, columnId: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d._key === key ? { ...d, columnId } : d)),
    );
  };

  const updateShowTotals = (key: number, showTotals: boolean) => {
    setDrafts((prev) =>
      prev.map((d) => (d._key === key ? { ...d, showTotals } : d)),
    );
  };

  const updateAggregates = (key: number, aggregates: DraftAggregateRule[]) => {
    setDrafts((prev) =>
      prev.map((d) => (d._key === key ? { ...d, aggregates } : d)),
    );
  };

  const removeDraft = (key: number) => {
    setDrafts((prev) => prev.filter((d) => d._key !== key));
  };

  const moveDraft = (index: number, direction: -1 | 1) => {
    setDrafts((prev) => {
      const target = index + direction;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const addLevel = () => {
    setDrafts((prev) => {
      const usedColumnIds = new Set(prev.map((d) => d.columnId));
      const col = groupableColumns.find((c) => !usedColumnIds.has(c.id));
      return col ? [...prev, makeDraft(col)] : prev;
    });
  };

  const handleApply = () => {
    onApply(draftsToGrouping(drafts, groupableColumns, aggregatableColumns));
    onOpenChange(false);
  };

  const handleClearAll = () => {
    onApply([]);
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="flex flex-col p-0 data-[side=right]:w-[92%]"
        side="right"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-base">{t("groupBy")}</SheetTitle>
          <SheetDescription className="hidden">
            {t("addGroupLevels")}
          </SheetDescription>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <XIcon className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        <div className="scrollbar-thumb-rounded scrollbar-thin flex-1 overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80">
          <div className="flex flex-col gap-2 px-4 py-3">
            {drafts.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noGroupingApplied")}
              </p>
            )}

            {drafts.map((draft, index) => (
              <LevelRow
                key={draft._key}
                draft={draft}
                index={index}
                count={drafts.length}
                groupableColumns={groupableColumns}
                aggregatableColumns={aggregatableColumns}
                usedColumnIds={new Set(drafts.map((d) => d.columnId))}
                onChangeColumn={(columnId) =>
                  updateColumn(draft._key, columnId)
                }
                onToggleShowTotals={(showTotals) =>
                  updateShowTotals(draft._key, showTotals)
                }
                onChangeAggregates={(aggregates) =>
                  updateAggregates(draft._key, aggregates)
                }
                onMoveUp={() => moveDraft(index, -1)}
                onMoveDown={() => moveDraft(index, 1)}
                onRemove={() => removeDraft(draft._key)}
              />
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start gap-1 text-xs text-muted-foreground"
              onClick={addLevel}
              disabled={
                groupableColumns.length === 0 ||
                drafts.length >= groupableColumns.length
              }
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {t("addLevel")}
            </Button>
          </div>
        </div>

        <SheetFooter className="shrink-0 flex-col gap-2 border-t px-4 py-3">
          <Button size="sm" className="w-full" onClick={handleApply}>
            {t("apply")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            disabled={drafts.length === 0}
            onClick={handleClearAll}
          >
            {t("clearAll")}
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
