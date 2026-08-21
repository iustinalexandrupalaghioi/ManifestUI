"use client"

import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { PlusIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import type { AggregatableColumn } from "../aggregates"
import { AGGREGATES_BY_TYPE, getAggregateLabel } from "../aggregates"
import type { AggregateFunction, AggregateRule } from "../aggregates"

export interface TotalsPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialRules: AggregateRule[]
  aggregatableColumns: AggregatableColumn[]
  focusColumnId?: string | null
  onApply: (rules: AggregateRule[]) => void
}

interface DraftRule {
  _key: number
  columnId: string
  fn: AggregateFunction
}

let keyCounter = 0
function nextKey() {
  return ++keyCounter
}

function makeDraft(col: AggregatableColumn): DraftRule {
  const fn = AGGREGATES_BY_TYPE[col.type]?.[0]
  return { _key: nextKey(), columnId: col.id, fn }
}

function ruleFromExisting(rule: AggregateRule): DraftRule {
  return { _key: nextKey(), columnId: rule.columnId, fn: rule.fn }
}

interface RuleRowProps {
  draft: DraftRule
  aggregatableColumns: AggregatableColumn[]
  usedColumnIds: Set<string>
  onChange: (updated: DraftRule) => void
  onRemove: () => void
}

function RuleRow({
  draft,
  aggregatableColumns,
  usedColumnIds,
  onChange,
  onRemove,
}: RuleRowProps) {
  const t = useTranslations("Aggregates")
  const col = aggregatableColumns.find((c) => c.id === draft.columnId)
  const fns = col ? AGGREGATES_BY_TYPE[col.type] : []

  return (
    <div className="flex items-start gap-2 rounded-md border p-3">
      <div className="flex flex-1 flex-col gap-2">
        <Select
          value={draft.columnId}
          onValueChange={(columnId) => {
            const newCol = aggregatableColumns.find((c) => c.id === columnId)!
            const fn = AGGREGATES_BY_TYPE[newCol.type]?.[0]
            onChange({ ...draft, columnId, fn })
          }}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder={t("columnPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {aggregatableColumns
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

        <Select
          value={draft.fn}
          onValueChange={(fn) => onChange({ ...draft, fn: fn as AggregateFunction })}
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
        variant="ghost"
        size="icon"
        className="h-6 w-8 text-muted-foreground hover:text-destructive"
        onClick={onRemove}
        aria-label={t("removeRule")}
      >
        <XIcon className="h-3.5 w-3.5" />
      </Button>
    </div>
  )
}

export function TotalsPanel({
  open,
  onOpenChange,
  initialRules,
  aggregatableColumns,
  focusColumnId,
  onApply,
}: TotalsPanelProps) {
  const t = useTranslations("Aggregates")
  const tc = useTranslations("Common")
  const [drafts, setDrafts] = useState<DraftRule[]>([])

  useEffect(() => {
    if (!open) return
    const seeded = initialRules.map(ruleFromExisting)
    if (focusColumnId && !seeded.some((d) => d.columnId === focusColumnId)) {
      const col = aggregatableColumns.find((c) => c.id === focusColumnId)
      if (col) seeded.push(makeDraft(col))
    }
    setDrafts(seeded)
  }, [open])

  const updateDraft = (key: number, updated: DraftRule) => {
    setDrafts((prev) => prev.map((d) => (d._key === key ? updated : d)))
  }

  const removeDraft = (key: number) => {
    setDrafts((prev) => prev.filter((d) => d._key !== key))
  }

  const addRule = () => {
    setDrafts((prev) => {
      const usedColumnIds = new Set(prev.map((d) => d.columnId))
      const col = aggregatableColumns.find((c) => !usedColumnIds.has(c.id))
      return col ? [...prev, makeDraft(col)] : prev
    })
  }

  const handleApply = () => {
    const rules: AggregateRule[] = drafts
      .map((d): AggregateRule | null => {
        const col = aggregatableColumns.find((c) => c.id === d.columnId)
        if (!col) return null
        return {
          columnId: col.id,
          columnName: col.dbName,
          columnLabel: col.name,
          columnType: col.type,
          ...(col.origin ? { origin: col.origin } : {}),
          fn: d.fn,
        }
      })
      .filter((r): r is AggregateRule => r !== null)
    onApply(rules)
    onOpenChange(false)
  }

  const handleClearAll = () => {
    onApply([])
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="flex flex-col p-0"
        side="right"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-base">{t("totals")}</SheetTitle>
          <SheetDescription className="hidden">
            {t("addTotalRules")}
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
                {t("noTotalsApplied")}
              </p>
            )}

            {drafts.map((draft) => (
              <RuleRow
                key={draft._key}
                draft={draft}
                aggregatableColumns={aggregatableColumns}
                usedColumnIds={new Set(drafts.map((d) => d.columnId))}
                onChange={(updated) => updateDraft(draft._key, updated)}
                onRemove={() => removeDraft(draft._key)}
              />
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start gap-1 text-xs text-muted-foreground"
              onClick={addRule}
              disabled={
                aggregatableColumns.length === 0 ||
                drafts.length >= aggregatableColumns.length
              }
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {t("addTotal")}
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
  )
}
