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
import { CustomYesNoSwitch } from "@/framework/components/ui/CustomYesNoSwitch"
import { formatByType } from "@/framework/lib/utils"
import { LockIcon, PlusIcon, XIcon } from "lucide-react"
import { useEffect, useState } from "react"
import { useTranslations } from "next-intl"
import {
  type ColumnType,
  type FilterableColumn,
  type FilterOperator,
  type FilterRule,
  OPERATORS_BY_TYPE,
  getOperatorDisplay,
} from "../filters"
import { FilterValueInput } from "./FilterValueInput"

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface FilterPanelProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialFilters: FilterRule[]
  filterableColumns: FilterableColumn[]
  focusColumnId?: string | null
  onApply: (rules: FilterRule[]) => void
  staticFilters?: FilterRule[]
}

// ─────────────────────────────────────────────
// Draft rule — like FilterRule but id required
// ─────────────────────────────────────────────

interface DraftRule {
  _key: number
  columnId: string
  operator: FilterOperator | ""
  value: string | string[]
}

let keyCounter = 0
function nextKey() {
  return ++keyCounter
}

function getDefaultOperator(type: ColumnType): FilterOperator {
  if (type === "boolean") return "is_true"
  return OPERATORS_BY_TYPE[type]?.[0] ?? "equals"
}

function getDefaultValue(
  _type: ColumnType,
  operator: FilterOperator | ""
): string | string[] {
  if ((operator as string) === "is_any_of") return []
  return ""
}

function makeDraft(col: FilterableColumn): DraftRule {
  const operator = getDefaultOperator(col.type)
  return {
    _key: nextKey(),
    columnId: col.id,
    operator,
    value: getDefaultValue(col.type, operator),
  }
}

function ruleFromExisting(rule: FilterRule): DraftRule {
  return {
    _key: nextKey(),
    columnId: rule.columnId,
    operator: rule.operator,
    value: rule.value === null ? "" : (rule.value as string | string[]),
  }
}

function translateFixedValue(
  fixedValue: string | undefined,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
  tc: (key: string, values?: Record<string, string | number | Date>) => string,
): string | undefined {
  if (fixedValue === "Empty") return t("empty")
  if (fixedValue === "Yes") return tc("yes")
  if (fixedValue === "No") return tc("no")
  return fixedValue
}

function noValueNeeded(op: FilterOperator | "") {
  return (
    op === "is_empty" ||
    op === "is_not_empty" ||
    op === "is_true" ||
    op === "is_false"
  )
}

function isRuleValid(
  draft: DraftRule,
  col: FilterableColumn | undefined
): boolean {
  if (!col || !draft.operator) return false
  if (noValueNeeded(draft.operator)) return true
  if (Array.isArray(draft.value)) return draft.value.length > 0
  if (col.type === "number")
    return draft.value !== "" && !isNaN(Number(draft.value))
  if (col.type === "time") return /^\d{2}:\d{2}:\d{2}$/.test(draft.value)
  if (col.type === "datetime") {
    const [datePart, timePart] = draft.value.split("T")
    return !!datePart && /^\d{2}:\d{2}:\d{2}$/.test(timePart ?? "")
  }
  if (col.type === "date") return !!draft.value
  return draft.value.trim() !== ""
}

// ─────────────────────────────────────────────
// Single rule row
// ─────────────────────────────────────────────

interface RuleRowProps {
  draft: DraftRule
  filterableColumns: FilterableColumn[]
  usedColumnIds: Set<string>
  onChange: (updated: DraftRule) => void
  onRemove: () => void
}

function RuleRow({
  draft,
  filterableColumns,
  usedColumnIds,
  onChange,
  onRemove,
}: RuleRowProps) {
  const t = useTranslations("Filtering")
  const col = filterableColumns.find((c) => c.id === draft.columnId)
  const operators = col ? (OPERATORS_BY_TYPE[col.type] ?? []) : []
  const isBool = col?.type === "boolean"

  const handleColumnChange = (colId: string) => {
    const newCol = filterableColumns.find((c) => c.id === colId)
    if (!newCol) return
    const operator = getDefaultOperator(newCol.type)
    onChange({
      ...draft,
      columnId: colId,
      operator,
      value: getDefaultValue(newCol.type, operator),
    })
  }

  const handleOperatorChange = (op: string) => {
    const next = op as FilterOperator
    onChange({
      ...draft,
      operator: next,
      value:
        (next as string) === "is_any_of" && !Array.isArray(draft.value)
          ? []
          : (next as string) !== "is_any_of" && Array.isArray(draft.value)
            ? ""
            : draft.value,
    })
  }

  return (
    <div className="flex flex-col gap-2 rounded-md border p-3">
      <div className="flex items-center gap-2">
        {/* Column picker */}
        <Select value={draft.columnId} onValueChange={handleColumnChange}>
          <SelectTrigger className="h-8 flex-1 text-xs">
            <SelectValue placeholder={t("columnPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {filterableColumns
              .filter(
                (c) => c.id === draft.columnId || !usedColumnIds.has(c.id)
              )
              .map((c) => (
                <SelectItem key={c.id} value={c.id} className="text-xs">
                  {c.name}
                </SelectItem>
              ))}
          </SelectContent>
        </Select>

        {/* Remove */}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
          onClick={onRemove}
          aria-label={t("removeRule")}
        >
          <XIcon className="h-3.5 w-3.5" />
        </Button>
      </div>

      {col && (
        <>
          {isBool ? (
            /* Boolean — operator IS the value */
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("is")}</span>
              <CustomYesNoSwitch
                id={`bool-${draft._key}`}
                checked={draft.operator === "is_true"}
                onCheckedChange={(checked) =>
                  onChange({
                    ...draft,
                    operator: checked ? "is_true" : "is_false",
                  })
                }
              />
            </div>
          ) : (
            <>
              {/* Operator */}
              <Select
                value={draft.operator}
                onValueChange={handleOperatorChange}
              >
                <SelectTrigger className="h-8 w-full text-xs">
                  <SelectValue placeholder={t("conditionPlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {operators.map((op) => (
                    <SelectItem key={op} value={op} className="text-xs">
                      {t(`operator.${op}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Value */}
              {draft.operator && !noValueNeeded(draft.operator) && (
                <FilterValueInput
                  operator={draft.operator as FilterOperator}
                  columnType={col.type}
                  value={draft.value}
                  onChange={(v) => onChange({ ...draft, value: v })}
                  selectOptions={col.selectOptions}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  )
}

// ─────────────────────────────────────────────
// Panel
// ─────────────────────────────────────────────

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
    const rules: FilterRule[] = drafts
      .filter((d) => {
        const col = filterableColumns.find((c) => c.id === d.columnId)
        return isRuleValid(d, col)
      })
      .map((d) => {
        const col = filterableColumns.find((c) => c.id === d.columnId)!
        return {
          columnId: d.columnId,
          columnName: col.dbName,
          columnLabel: col.name,
          columnType: col.type,
          operator: d.operator as FilterOperator,
          origin: col.origin,
          value: noValueNeeded(d.operator) ? null : d.value,
        }
      })
    onApply(rules)
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
        className="flex flex-col p-0"
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
              <div className="mb-2 flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">
                  {t("appliedFromContext")}
                </p>
                {staticFilters.map((rule) => {
                  const { symbol, valueWrap, fixedValue: rawFixedValue, showValue } =
                    getOperatorDisplay(rule.operator)
                  const fixedValue = translateFixedValue(rawFixedValue, t, tc)
                  const rawValue =
                    fixedValue ??
                    (showValue === false
                      ? ""
                      : rule.value !== null
                        ? Array.isArray(rule.value)
                          ? rule.value
                              .map((v) =>
                                formatByType(
                                  v,
                                  rule.columnType,
                                  rule.selectOptions
                                )
                              )
                              .join(", ")
                          : formatByType(
                              rule.value,
                              rule.columnType,
                              rule.selectOptions
                            )
                        : "")

                  const displayValue =
                    !rawValue || fixedValue
                      ? rawValue
                      : valueWrap === "quotes"
                        ? `"${rawValue}"`
                        : valueWrap === "brackets"
                          ? `[${rawValue}]`
                          : rawValue

                  return (
                    <div
                      key={rule.columnId}
                      className="flex items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm text-muted-foreground"
                    >
                      <span className="font-medium">{rule.columnLabel}</span>
                      <span>{symbol}</span>
                      {displayValue && <span>{displayValue}</span>}
                      <LockIcon className="ml-auto size-3 shrink-0" />
                    </div>
                  )
                })}
              </div>
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
