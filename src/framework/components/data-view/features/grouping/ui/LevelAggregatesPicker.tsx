"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { AggregatableColumn, AggregateFunction } from "../../aggregates/aggregates";
import { AGGREGATES_BY_TYPE, getAggregateLabel } from "../../aggregates/aggregates";
import { makeAggregateDraft, type DraftAggregateRule } from "./groupByDrafts";

interface LevelAggregatesPickerProps {
  aggregates: DraftAggregateRule[];
  aggregatableColumns: AggregatableColumn[];
  onChange: (aggregates: DraftAggregateRule[]) => void;
}

// A per-level, independent picker of column+function totals — separate
// from the table's own Σ Totals rules, so a group can show e.g. avg(price)
// without that also landing in the whole-table grand-total footer.
export function LevelAggregatesPicker({
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
