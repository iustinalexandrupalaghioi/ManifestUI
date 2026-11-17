"use client"

import { Button } from "@/components/ui/button"
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
import type { FilterableColumn, FilterRule } from "../filters"
import { draftsToRules, isRuleValid, makeDraft, ruleFromExisting, type DraftRule } from "./filterDrafts"
import { RuleRow } from "./FilterRuleRow"
import { StaticFilterList } from "./StaticFilterList"

export interface FilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFilters: FilterRule[]
  filterableColumns: FilterableColumn[]
  focusColumnId?: string | null
  onApply: (rules: FilterRule[]) => void
  staticFilters?: FilterRule[]
}

/** The Filters side panel: edits a copy of the rules and applies the complete ones as a whole. */
export function FilterPanel({
  open,
  onOpenChange,
  initialFilters,
  filterableColumns,
  focusColumnId,
  onApply,
  staticFilters,
}: FilterPanelProps) {
  const t = useTranslations("Filtering")
  const tc = useTranslations("Common")
  const [drafts, setDrafts] = useState<DraftRule[]>([])

  useEffect(() => {
    if (!open) return

    if (initialFilters.length > 0) {
      setDrafts(initialFilters.map(ruleFromExisting))
    } else {
      setDrafts([])
    }
  }, [open])

  useEffect(() => {
    if (!open || !focusColumnId) return
    setDrafts((prev) => {
      if (prev.some((d) => d.columnId === focusColumnId)) return prev
      const col = filterableColumns.find((c) => c.id === focusColumnId)
      return col ? [...prev, makeDraft(col)] : prev
    })
  }, [focusColumnId])

  const updateDraft = (key: number, updated: DraftRule) => {
    setDrafts((prev) => prev.map((d) => (d._key === key ? updated : d)))
  }

  const removeDraft = (key: number) => {
    setDrafts((prev) => prev.filter((d) => d._key !== key))
  }

  const addRule = () => {
    setDrafts((prev) => {
      const usedColumnIds = new Set(prev.map((d) => d.columnId))
      const col = filterableColumns.find((c) => !usedColumnIds.has(c.id))
      return col ? [...prev, makeDraft(col)] : prev
    })
  }

  const handleApply = () => {
    onApply(draftsToRules(drafts, filterableColumns))
    onOpenChange(false)
  }

  const handleClearAll = () => {
    onApply([])
    onOpenChange(false)
  }

  const allValid = drafts.every((d) => {
    const col = filterableColumns.find((c) => c.id === d.columnId)
    return isRuleValid(d, col)
  })

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        showCloseButton={false}
        className="flex flex-col p-0 data-[side=right]:w-[92%]"
        side="right"
        onCloseAutoFocus={(e) => e.preventDefault()}
      >
        {/* Sticky header */}
        <SheetHeader className="flex shrink-0 flex-row items-center justify-between border-b px-4 py-3">
          <SheetTitle className="text-base">{t("filters")}</SheetTitle>
          <SheetDescription className="hidden">
            {t("addFilterRules")}
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
            {staticFilters && staticFilters.length > 0 && (
              <StaticFilterList staticFilters={staticFilters} />
            )}

            {drafts.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                {t("noFiltersApplied")}
              </p>
            )}

            {drafts.map((draft) => {
              return (
                <RuleRow
                  key={draft._key}
                  draft={draft}
                  filterableColumns={filterableColumns}
                  usedColumnIds={new Set(drafts.map((d) => d.columnId))}
                  onChange={(updated) => updateDraft(draft._key, updated)}
                  onRemove={() => removeDraft(draft._key)}
                />
              )
            })}

            <Button
              variant="ghost"
              size="sm"
              className="mt-1 w-full justify-start gap-1 text-xs text-muted-foreground"
              onClick={addRule}
              disabled={
                filterableColumns.length === 0 ||
                drafts.length >= filterableColumns.length
              }
            >
              <PlusIcon className="h-3.5 w-3.5" />
              {t("addFilter")}
            </Button>
          </div>
        </div>

        {/* Sticky footer */}
        <SheetFooter className="shrink-0 flex-col gap-2 border-t px-4 py-3">
          <Button
            size="sm"
            className="w-full"
            onClick={handleApply}
            disabled={!allValid}
          >
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
