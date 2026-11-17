"use client";

import { Button } from "@/components/ui/button";
import { CustomYesNoSwitch } from "@/framework/components/ui/CustomYesNoSwitch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDownIcon, ChevronUpIcon, SigmaIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { GroupableColumn } from "../grouping";
import type { AggregatableColumn } from "../../aggregates/aggregates";
import type { DraftAggregateRule, DraftLevel } from "./groupByDrafts";
import { LevelAggregatesPicker } from "./LevelAggregatesPicker";

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

/** One grouping level: its column, order, and optional group totals. */
export function LevelRow({
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
