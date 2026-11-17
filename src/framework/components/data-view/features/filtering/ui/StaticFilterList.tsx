"use client"

import { formatByType } from "@/framework/lib/utils"
import { LockIcon } from "lucide-react"
import { useTranslations } from "next-intl"
import { type FilterRule, getOperatorDisplay } from "../filters"

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

/** Filters set by the list's context (e.g. an embedded list's relation): shown locked, not editable. */
export function StaticFilterList({ staticFilters }: { staticFilters: FilterRule[] }) {
  const t = useTranslations("Filtering")
  const tc = useTranslations("Common")
  return (
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
  )
}
