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
import type { SortingState } from "@tanstack/react-table"
import { ArrowDown, ArrowUp, PlusIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import type { SortableColumn } from "../useSortableColumns"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface SortPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialSorting: SortingState
  sortableColumns: SortableColumn[]
  onApply: (sorting: SortingState) => void
}

interface DraftRule {
  _key: number
  columnId: string
  desc: boolean
}

let keyCounter = 0
function nextKey() {
  return ++keyCounter
}

function makeDraft(col: SortableColumn): DraftRule {
  return { _key: nextKey(), columnId: col.id, desc: false }
}

function ruleFromExisting(rule: SortingState[number]): DraftRule {
  return { _key: nextKey(), columnId: rule.id, desc: rule.desc }
}

// ─────────────────────────────────────────────
// Single rule row
// ─────────────────────────────────────────────

interface RuleRowProps {
  draft: DraftRule
  sortableColumns: SortableColumn[]
  usedColumnIds: Set<string>
  isFirst: boolean
  isLast: boolean
  onChange: (updated: DraftRule) => void
  onRemove: () => void
  onMoveUp: () => void
  onMoveDown: () => void
}

function RuleRow({
  draft,
  sortableColumns,
  usedColumnIds,
  isFirst,
  isLast,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
}: RuleRowProps) {
  const t = useTranslations("Sorting")

  return (
    <div className="flex items-start gap-2 rounded-md border p-3">
      <div className="flex flex-1 flex-col gap-2">
        {/* Column picker */}
        <Select
          value={draft.columnId}
          onValueChange={(columnId) => onChange({ ...draft, columnId })}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue placeholder={t("columnPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {sortableColumns
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

        {/* Direction */}
        <Select
          value={draft.desc ? "desc" : "asc"}
          onValueChange={(v) => onChange({ ...draft, desc: v === "desc" })}
        >
          <SelectTrigger className="h-8 w-full text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asc" className="text-xs">
              {t("ascending")}
            </SelectItem>
            <SelectItem value="desc" className="text-xs">
              {t("descending")}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Reorder + remove */}
      <div className="flex flex-col items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-8 text-muted-foreground disabled:opacity-30"
          onClick={onMoveUp}
          disabled={isFirst}
          aria-label={t("moveUp")}
        >
          <ArrowUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-8 text-muted-foreground disabled:opacity-30"
          onClick={onMoveDown}
          disabled={isLast}
          aria-label={t("moveDown")}
        >
          <ArrowDown className="h-3.5 w-3.5" />
        </Button>
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
    </div>
  )
}

// ─────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────

export function SortPanel({
  open,
  onOpenChange,
  initialSorting,
  sortableColumns,
  onApply,
}: SortPanelProps) {
  const t = useTranslations("Sorting")
  const tc = useTranslations("Common")
  const [drafts, setDrafts] = useState<DraftRule[]>([])

  useEffect(() => {
    if (!open) return
    setDrafts(initialSorting.map(ruleFromExisting))
  }, [open])

  const updateDraft = (key: number, updated: DraftRule) => {
    setDrafts((prev) => prev.map((d) => (d._key === key ? updated : d)))
  }

  const removeDraft = (key: number) => {
    setDrafts((prev) => prev.filter((d) => d._key !== key))
  }

  const moveDraft = (index: number, direction: -1 | 1) => {
    setDrafts((prev) => {
      const next = [...prev]
      const target = index + direction
      if (target < 0 || target >= next.length) return prev
      ;[next[index], next[target]] = [next[target], next[index]]
      return next
    })
  }

  const addRule = () => {
    setDrafts((prev) => {
      const usedColumnIds = new Set(prev.map((d) => d.columnId))
      const col = sortableColumns.find((c) => !usedColumnIds.has(c.id))
      return col ? [...prev, makeDraft(col)] : prev
    })
  }

  const handleApply = () => {
    const sorting: SortingState = drafts
      .filter((d) => sortableColumns.some((c) => c.id === d.columnId))
      .map((d) => {
        const col = sortableColumns.find((c) => c.id === d.columnId)!
        return {
          id: d.columnId,
          desc: d.desc,
          columnName: col.dbName,
          origin: col.origin,
        }
      })
    onApply(sorting)
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
        {/* Sticky header */}
        <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-base">{t("sort")}</SheetTitle>
          <SheetDescription className="hidden">
            {t("addSortRules")}
          </SheetDescription>
          <SheetClose asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <XIcon className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>

        {/* Scrollable body */}
        <div className="scrollbar-thumb-rounded scrollbar-thin flex-1 overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80">
          <div className="flex flex-col gap-2 px-4 py-3">
            {drafts.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noSortApplied")}
              </p>
            )}

            {drafts.map((draft, index) => (
              <RuleRow
                key={draft._key}
                draft={draft}
                sortableColumns={sortableColumns}
                usedColumnIds={new Set(drafts.map((d) => d.columnId))}
                isFirst={index === 0}
                isLast={index === drafts.length - 1}
                onChange={(updated) => updateDraft(draft._key, updated)}
                onRemove={() => removeDraft(draft._key)}
                onMoveUp={() => moveDraft(index, -1)}
                onMoveDown={() => moveDraft(index, 1)}
              />
            ))}

            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start gap-1 text-xs text-muted-foreground"
              onClick={addRule}
              disabled={
                sortableColumns.length === 0 ||
                drafts.length >= sortableColumns.length
              }
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {t("addSort")}
            </Button>
          </div>
        </div>

        {/* Sticky footer */}
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
