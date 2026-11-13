import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn, formatByType } from "@/framework/lib/utils"
import type { Enum } from "@/framework/types/global/Enum"
import { ChevronDown, X } from "lucide-react"
import { useTranslations } from "next-intl"
import { useDataViewCore } from "../../../core/stores/DataViewProvider"
import { getOperatorDisplay, type FilterRule } from "../filters"

const MAX_VISIBLE = 2

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

type Translator = (
  key: string,
  values?: Record<string, string | number | Date>,
) => string

function translateFixedValue(
  fixedValue: string | undefined,
  t: Translator,
  tc: Translator,
): string | undefined {
  if (fixedValue === "Empty") return t("empty")
  if (fixedValue === "Yes") return tc("yes")
  if (fixedValue === "No") return tc("no")
  return fixedValue
}

function formatChipValue(
  rule: FilterRule,
  t: Translator,
  tc: Translator,
  selectOptions?: Enum[]
): string | null {
  const { showValue, valueWrap, fixedValue: rawFixedValue } = getOperatorDisplay(
    rule.operator,
  )
  const fixedValue = translateFixedValue(rawFixedValue, t, tc)

  if (showValue === false) return null
  if (fixedValue) return fixedValue

  if (rule.value) {
    const raw = Array.isArray(rule.value)
      ? rule.value
          .map((v) => formatByType(v, rule.columnType, selectOptions))
          .join(", ")
      : formatByType(rule.value as string, rule.columnType, selectOptions)

    return valueWrap === "quotes"
      ? `"${raw}"`
      : valueWrap === "brackets"
        ? `[${raw}]`
        : raw
  }

  return null
}

// ─────────────────────────────────────────────
// FilterChip — single pill
// ─────────────────────────────────────────────

function FilterChip({
  rule,
  onRemove,
  onEdit,
  locked = false,
  selectOptions,
}: {
  rule: FilterRule
  onRemove: () => void
  onEdit: () => void
  locked?: boolean
  selectOptions?: Enum[]
}) {
  const t = useTranslations("Filtering")
  const tc = useTranslations("Common")
  const { symbol } = getOperatorDisplay(rule.operator)
  const value = formatChipValue(rule, t, tc, selectOptions)

  return (
    <Badge
      variant={locked ? "secondary" : "outline"}
      className={cn(
        "flex h-8 items-center gap-1 rounded-md px-2 py-0 text-sm font-normal",
        !locked && "cursor-pointer"
      )}
      onClick={!locked ? onEdit : undefined}
    >
      <span className="font-medium">{rule.columnLabel}</span>
      <span className="text-primary">{symbol}</span>
      {value && <span className="max-w-30 truncate">{value}</span>}
      {!locked && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          title={t("removeFilterOn", { label: rule.columnLabel })}
          className="ml-0.5 rounded-sm opacity-60 ring-offset-background transition-opacity hover:opacity-100 focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none"
          aria-label={t("removeFilterOn", { label: rule.columnLabel })}
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </Badge>
  )
}

// ─────────────────────────────────────────────
// OverflowPopover — "+N more" badge with all filters listed
// ─────────────────────────────────────────────

function OverflowPopover({
  rules,
  onRemove,
  onEdit,
  onClearAll,
  getSelectOptions,
}: {
  rules: FilterRule[]
  onRemove: (columnId: string) => void
  onEdit: (columnId: string) => void
  onClearAll: () => void
  getSelectOptions: (columnId: string) => Enum[] | undefined
}) {
  const t = useTranslations("Filtering")
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs">
          {t("moreCount", { count: rules.length })}
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="max-h-64 max-w-96 p-2 pe-0">
        <div className="scrollbar-thin flex flex-col gap-1 overflow-y-auto scrollbar-thumb-primary scrollbar-track-muted">
          {rules.map((rule) => (
            <FilterChip
              key={rule.columnId}
              rule={rule}
              selectOptions={getSelectOptions(rule.columnId)}
              onRemove={() => onRemove(rule.columnId)}
              onEdit={() => onEdit(rule.columnId)}
            />
          ))}
        </div>
        <div className="border-t pt-1">
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            {t("clearAll")}
          </button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

// ─────────────────────────────────────────────
// FilterChips — public component
// ─────────────────────────────────────────────

interface FilterChipsProps {
  filters: FilterRule[]
  onRemove: (columnId: string) => void
  onClearAll: () => void
  onOpenFilter: (columnId?: string) => void
}

export function FilterChips({
  filters,
  onRemove,
  onClearAll,
  onOpenFilter,
}: FilterChipsProps) {
  const t = useTranslations("Filtering")
  const { table } = useDataViewCore()

  if (filters.length === 0) return null

  const getSelectOptions = (columnId: string) =>
    table.getColumn(columnId)?.columnDef?.meta?.selectOptions

  const visible = filters.slice(0, MAX_VISIBLE)
  const overflow = filters.slice(MAX_VISIBLE)

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((rule) => (
        <FilterChip
          key={rule.columnId}
          rule={rule}
          selectOptions={getSelectOptions(rule.columnId)}
          onRemove={() => onRemove(rule.columnId)}
          onEdit={() => onOpenFilter(rule.columnId)}
        />
      ))}

      {overflow.length > 0 ? (
        <OverflowPopover
          rules={overflow}
          onRemove={onRemove}
          onEdit={onOpenFilter}
          onClearAll={onClearAll}
          getSelectOptions={getSelectOptions}
        />
      ) : (
        filters.length > 1 && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
          >
            {t("clearAll")}
          </button>
        )
      )}
    </div>
  )
}
