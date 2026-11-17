import {
  type ColumnType,
  type FilterableColumn,
  type FilterOperator,
  type FilterRule,
  OPERATORS_BY_TYPE,
} from "../filters"

/** The filter panel's editable copy of a rule, before Apply (its value may still be incomplete). */
export interface DraftRule {
  _key: number
  columnId: string
  operator: FilterOperator | ""
  value: string | string[]
}

let keyCounter = 0
function nextKey() {
  return ++keyCounter
}

export function getDefaultOperator(type: ColumnType): FilterOperator {
  if (type === "boolean") return "is_true"
  return OPERATORS_BY_TYPE[type]?.[0] ?? "equals"
}

export function getDefaultValue(
  _type: ColumnType,
  operator: FilterOperator | ""
): string | string[] {
  if ((operator as string) === "is_any_of") return []
  return ""
}

export function makeDraft(col: FilterableColumn): DraftRule {
  const operator = getDefaultOperator(col.type)
  return {
    _key: nextKey(),
    columnId: col.id,
    operator,
    value: getDefaultValue(col.type, operator),
  }
}

export function ruleFromExisting(rule: FilterRule): DraftRule {
  return {
    _key: nextKey(),
    columnId: rule.columnId,
    operator: rule.operator,
    value: rule.value === null ? "" : (rule.value as string | string[]),
  }
}

/** Operators whose rule needs no value (empty checks, booleans). */
export function noValueNeeded(op: FilterOperator | "") {
  return (
    op === "is_empty" ||
    op === "is_not_empty" ||
    op === "is_true" ||
    op === "is_false"
  )
}

/** Whether a draft is complete enough to apply. */
export function isRuleValid(
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

/** The rules the drafts describe, keeping only complete ones. */
export function draftsToRules(drafts: DraftRule[], filterableColumns: FilterableColumn[]): FilterRule[] {
  return drafts
    .filter((d) => isRuleValid(d, filterableColumns.find((c) => c.id === d.columnId)))
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
}
