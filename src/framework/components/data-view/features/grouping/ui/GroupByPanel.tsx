"use client";

import { Button } from "@/components/ui/button";
import { CustomYesNoSwitch } from "@/framework/components/ui/CustomYesNoSwitch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  PlusIcon,
  SigmaIcon,
  XIcon,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { GroupableColumn, GroupByRule } from "../grouping";
import type {
  AggregatableColumn,
  AggregateFunction,
  AggregateRule,
} from "../../aggregates/aggregates";
import {
  AGGREGATES_BY_TYPE,
  getAggregateLabel,
} from "../../aggregates/aggregates";

export interface GroupByPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialGrouping: GroupByRule[];
  groupableColumns: GroupableColumn[];
  aggregatableColumns: AggregatableColumn[];
  onApply: (grouping: GroupByRule[]) => void;
}

interface DraftAggregateRule {
  _key: number;
  columnId: string;
  fn: AggregateFunction;
}

interface DraftLevel {
  _key: number;
  columnId: string;
  showTotals: boolean;
  aggregates: DraftAggregateRule[];
}

let keyCounter = 0;
function nextKey() {
  return ++keyCounter;
}

function makeAggregateDraft(col: AggregatableColumn): DraftAggregateRule {
  const fn = AGGREGATES_BY_TYPE[col.type]?.[0];
  return { _key: nextKey(), columnId: col.id, fn };
}

function aggregateDraftFromExisting(rule: AggregateRule): DraftAggregateRule {
  return { _key: nextKey(), columnId: rule.columnId, fn: rule.fn };
}

function makeDraft(col: GroupableColumn): DraftLevel {
  return {
    _key: nextKey(),
    columnId: col.id,
    showTotals: false,
    aggregates: [],
  };
}

function levelFromExisting(rule: GroupByRule): DraftLevel {
  return {
    _key: nextKey(),
    columnId: rule.columnId,
    showTotals: rule.showTotals ?? false,
    aggregates: (rule.aggregates ?? []).map(aggregateDraftFromExisting),
  };
}

interface LevelAggregatesPickerProps {
  aggregates: DraftAggregateRule[];
  aggregatableColumns: AggregatableColumn[];
  onChange: (aggregates: DraftAggregateRule[]) => void;
}

// A per-level, independent picker of column+function totals — separate
// from the table's own Σ Totals rules, so a group can show e.g. avg(price)
// without that also landing in the whole-table grand-total footer.
function LevelAggregatesPicker({
  aggregates,
  aggregatableColumns,
  onChange,
}: LevelAggregatesPickerProps) {
  const t = useTranslations("Aggregates");
  const usedColumnIds = new Set(aggregates.map((d) => d.columnId));

  const updateRule = (key: number, updated: DraftAggregateRule) => {
    onChange(aggregates.map((d) => (d._key === key ? updated : d)));
  };
  const removeRule = (key: number) => {
    onChange(aggregates.filter((d) => d._key !== key));
  };
  const addRule = () => {
    const col = aggregatableColumns.find((c) => !usedColumnIds.has(c.id));
    if (col) onChange([...aggregates, makeAggregateDraft(col)]);
  };

  return (
    <div className="flex flex-col gap-2">
      {aggregates.length === 0 && (
        <p className="py-2 text-center text-xs text-muted-foreground">
          {t("noTotalsApplied")}
        </p>
      )}

      {aggregates.map((draft) => {
        const col = aggregatableColumns.find((c) => c.id === draft.columnId);
        const fns = col ? AGGREGATES_BY_TYPE[col.type] : [];
        return (
          <div
            key={draft._key}
            className="flex items-start gap-2 rounded-md border p-3"
          >
            <div className="flex flex-1 flex-col gap-2">
              <Select
                value={draft.columnId}
                onValueChange={(columnId) => {
                  const newCol = aggregatableColumns.find(
                    (c) => c.id === columnId,
                  )!;
                  const fn = AGGREGATES_BY_TYPE[newCol.type]?.[0];
                  updateRule(draft._key, { ...draft, columnId, fn });
                }}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue placeholder={t("columnPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {aggregatableColumns
                    .filter(
                      (c) =>
                        c.id === draft.columnId || !usedColumnIds.has(c.id),
                    )
                    .map((c) => (
                      <SelectItem key={c.id} value={c.id} className="text-xs">
                        {c.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              <Select
                value={draft.fn}
                onValueChange={(fn) =>
                  updateRule(draft._key, {
                    ...draft,
                    fn: fn as AggregateFunction,
                  })
                }
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {fns.map((fn) => (
                    <SelectItem key={fn} value={fn} className="text-xs">
                      {getAggregateLabel(fn, t)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-6 w-8 text-muted-foreground hover:text-destructive"
              onClick={() => removeRule(draft._key)}
              aria-label={t("removeRule")}
            >
              <XIcon className="h-3.5 w-3.5" />
            </Button>
          </div>
        );
      })}

      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="justify-start gap-1 text-xs text-muted-foreground"
        onClick={addRule}
        disabled={
          aggregatableColumns.length === 0 ||
          aggregates.length >= aggregatableColumns.length
        }
      >
        <PlusIcon className="h-3.5 w-3.5" />
        {t("addTotal")}
      </Button>
    </div>
  );
}

interface LevelRowProps {
  draft: DraftLevel;
  index: number;
  count: number;
  groupableColumns: GroupableColumn[];
  aggregatableColumns: AggregatableColumn[];
  usedColumnIds: Set<string>;
  onChangeColumn: (columnId: string) => void;
  onToggleShowTotals: (showTotals: boolean) => void;
  onChangeAggregates: (aggregates: DraftAggregateRule[]) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
}

function LevelRow({
  draft,
  index,
  count,
  groupableColumns,
  aggregatableColumns,
  usedColumnIds,
  onChangeColumn,
  onToggleShowTotals,
  onChangeAggregates,
  onMoveUp,
  onMoveDown,
  onRemove,
}: LevelRowProps) {
  const t = useTranslations("Grouping");
  const tAgg = useTranslations("Aggregates");

  return (
    <div className="flex items-start gap-2 rounded-md border p-3">
      <div className="flex flex-col gap-1 pt-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground disabled:opacity-30"
          disabled={index === 0}
          onClick={onMoveUp}
          aria-label={t("moveUp")}
        >
          <ChevronUpIcon className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground disabled:opacity-30"
          disabled={index === count - 1}
          onClick={onMoveDown}
          aria-label={t("moveDown")}
        >
          <ChevronDownIcon className="h-3 w-3" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2">
        <span className="text-[10px] font-medium text-muted-foreground uppercase">
          {t("level", { index: index + 1 })}
        </span>
        <Select value={draft.columnId} onValueChange={onChangeColumn}>
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder={t("columnPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {groupableColumns
              .filter(
                (c) => c.id === draft.columnId || !usedColumnIds.has(c.id),
              )
              .map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          <Label
            htmlFor={`show-totals-${draft._key}`}
            className="text-xs font-normal text-muted-foreground"
          >
            {t("showGroupTotals")}
          </Label>
          <CustomYesNoSwitch
            id={`show-totals-${draft._key}`}
            checked={draft.showTotals}
            onCheckedChange={onToggleShowTotals}
          />
        </div>

        {draft.showTotals && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-7 justify-start gap-1.5 text-xs"
              >
                <SigmaIcon className="h-3.5 w-3.5" />
                {tAgg("totals")}
                {draft.aggregates.length > 0 && (
                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-medium text-primary-foreground">
                    {draft.aggregates.length}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="start">
              <LevelAggregatesPicker
                aggregates={draft.aggregates}
                aggregatableColumns={aggregatableColumns}
                onChange={onChangeAggregates}
              />
            </PopoverContent>
          </Popover>
        )}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={t("removeLevel")}
      >
        <XIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}

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
    const grouping: GroupByRule[] = drafts
      .map((d): GroupByRule | null => {
        const col = groupableColumns.find((c) => c.id === d.columnId);
        if (!col) return null;
        const aggregates: AggregateRule[] = d.aggregates
          .map((a): AggregateRule | null => {
            const aggCol = aggregatableColumns.find((c) => c.id === a.columnId);
            if (!aggCol) return null;
            return {
              columnId: aggCol.id,
              columnName: aggCol.dbName,
              columnLabel: aggCol.name,
              columnType: aggCol.type,
              ...(aggCol.origin ? { origin: aggCol.origin } : {}),
              fn: a.fn,
            };
          })
          .filter((r): r is AggregateRule => r !== null);
        return {
          columnId: col.id,
          columnName: col.dbName,
          columnLabel: col.name,
          columnType: col.type,
          ...(col.origin ? { origin: col.origin } : {}),
          showTotals: d.showTotals,
          ...(aggregates.length > 0 ? { aggregates } : {}),
        };
      })
      .filter((r): r is GroupByRule => r !== null);
    onApply(grouping);
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
