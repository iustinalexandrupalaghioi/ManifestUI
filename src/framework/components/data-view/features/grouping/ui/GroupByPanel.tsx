"use client"

import { Button } from "@/components/ui/button"
import { CustomYesNoSwitch } from "@/framework/components/ui/CustomYesNoSwitch"
import { Label } from "@/components/ui/label"
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
import { ChevronDownIcon, ChevronUpIcon, PlusIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import type { GroupableColumn, GroupByRule } from "../grouping"

export interface GroupByPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialGrouping: GroupByRule[]
  groupableColumns: GroupableColumn[]
  onApply: (grouping: GroupByRule[]) => void
}

interface DraftLevel {
  _key: number
  columnId: string
  showTotals: boolean
}

let keyCounter = 0
function nextKey() {
  return ++keyCounter
}

function makeDraft(col: GroupableColumn): DraftLevel {
  return { _key: nextKey(), columnId: col.id, showTotals: true }
}

function levelFromExisting(rule: GroupByRule): DraftLevel {
  return {
    _key: nextKey(),
    columnId: rule.columnId,
    showTotals: rule.showTotals ?? true,
  }
}

interface LevelRowProps {
  draft: DraftLevel
  index: number
  count: number
  groupableColumns: GroupableColumn[]
  usedColumnIds: Set<string>
  onChangeColumn: (columnId: string) => void
  onToggleShowTotals: (showTotals: boolean) => void
  onMoveUp: () => void
  onMoveDown: () => void
  onRemove: () => void
}

function LevelRow({
  draft,
  index,
  count,
  groupableColumns,
  usedColumnIds,
  onChangeColumn,
  onToggleShowTotals,
  onMoveUp,
  onMoveDown,
  onRemove,
}: LevelRowProps) {
  const t = useTranslations("Grouping")

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
          <ChevronUpIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-5 w-5 text-muted-foreground disabled:opacity-30"
          disabled={index === count - 1}
          onClick={onMoveDown}
          aria-label={t("moveDown")}
        >
          <ChevronDownIcon className="h-3.5 w-3.5" />
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

        <div className="flex items-center justify-between gap-2 pt-0.5">
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
  )
}

export function GroupByPanel({
  open,
  onOpenChange,
  initialGrouping,
  groupableColumns,
  onApply,
}: GroupByPanelProps) {
  const t = useTranslations("Grouping")
  const tc = useTranslations("Common")
  const [drafts, setDrafts] = useState<DraftLevel[]>([])

  useEffect(() => {
    if (!open) return
    setDrafts(initialGrouping.map(levelFromExisting))
  }, [open])

  const updateColumn = (key: number, columnId: string) => {
    setDrafts((prev) =>
      prev.map((d) => (d._key === key ? { ...d, columnId } : d)),
    )
  }

  const updateShowTotals = (key: number, showTotals: boolean) => {
    setDrafts((prev) =>
      prev.map((d) => (d._key === key ? { ...d, showTotals } : d)),
    )
  }

  const removeDraft = (key: number) => {
    setDrafts((prev) => prev.filter((d) => d._key !== key))
  }

  const moveDraft = (index: number, direction: -1 | 1) => {
    setDrafts((prev) => {
      const target = index + direction
      if (target < 0 || target >= prev.length) return prev
      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const addLevel = () => {
    setDrafts((prev) => {
      const usedColumnIds = new Set(prev.map((d) => d.columnId))
      const col = groupableColumns.find((c) => !usedColumnIds.has(c.id))
      return col ? [...prev, makeDraft(col)] : prev
    })
  }

  const handleApply = () => {
    const grouping: GroupByRule[] = drafts
      .map((d): GroupByRule | null => {
        const col = groupableColumns.find((c) => c.id === d.columnId)
        if (!col) return null
        return {
          columnId: col.id,
          columnName: col.dbName,
          columnLabel: col.name,
          columnType: col.type,
          ...(col.origin ? { origin: col.origin } : {}),
          showTotals: d.showTotals,
        }
      })
      .filter((r): r is GroupByRule => r !== null)
    onApply(grouping)
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
                usedColumnIds={new Set(drafts.map((d) => d.columnId))}
                onChangeColumn={(columnId) => updateColumn(draft._key, columnId)}
                onToggleShowTotals={(showTotals) =>
                  updateShowTotals(draft._key, showTotals)
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
  )
}
