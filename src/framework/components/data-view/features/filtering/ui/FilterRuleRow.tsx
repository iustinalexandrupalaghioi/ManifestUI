"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CustomYesNoSwitch } from "@/framework/components/ui/CustomYesNoSwitch"
import { XIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { type FilterableColumn, type FilterOperator, OPERATORS_BY_TYPE } from "../filters"
import { FilterValueInput } from "./FilterValueInput"
import { getDefaultOperator, getDefaultValue, noValueNeeded, type DraftRule } from "./filterDrafts"

interface RuleRowProps {
  draft: DraftRule
  filterableColumns: FilterableColumn[]
  usedColumnIds: Set<string>
  onChange: (updated: DraftRule) => void
  onRemove: () => void
}

/** One filter rule: column, condition and value (booleans are a single switch). */
export function RuleRow({
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
