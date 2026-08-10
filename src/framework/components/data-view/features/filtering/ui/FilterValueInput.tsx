import { CustomDateInput } from "@/framework/components/ui/CustomDateInput"
import { CustomDateTimeInput } from "@/framework/components/ui/CustomDateTimeInput"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CustomTimeInput } from "@/framework/components/ui/CustomTimeInput"
import { CustomYesNoSwitch } from "@/framework/components/ui/CustomYesNoSwitch"
import { useTranslations } from "next-intl"
import type { Enum } from "@/framework/types/global/Enum"
import type { ColumnType, FilterOperator } from "../filters"
import { FilterTagInput } from "./FilterTagInput"

interface FilterValueInputProps {
  operator: FilterOperator
  columnType: ColumnType
  value: string | string[]
  onChange: (v: string | string[]) => void
  selectOptions?: Enum[]
}

export function FilterValueInput({
  operator,
  columnType,
  value,
  onChange,
  selectOptions,
}: FilterValueInputProps) {
  const t = useTranslations("Filtering")
  const noValueNeeded =
    operator === "is_empty" ||
    operator === "is_not_empty" ||
    operator === "is_true" ||
    operator === "is_false"

  if (noValueNeeded) return null

  if (operator === "is_any_of" && columnType !== "select") {
    const selected = Array.isArray(value) ? value : []
    return (
      <FilterTagInput
        value={selected}
        onChange={onChange}
        placeholder={
          columnType === "number"
            ? t("numberListPlaceholder")
            : t("valueListPlaceholder")
        }
        validate={
          columnType === "number" ? (v) => !isNaN(Number(v)) : undefined
        }
      />
    )
  }

  if (columnType === "boolean") return null

  if (columnType === "select" && operator === "is_any_of") {
    const selected = Array.isArray(value) ? value : []
    const toggle = (opt: string) =>
      onChange(
        selected.includes(opt)
          ? selected.filter((v) => v !== opt)
          : [...selected, opt]
      )
    return (
      <div className="flex flex-col gap-2">
        {(selectOptions ?? []).map((opt) => (
          <div key={opt.value} className="grid grid-cols-2 gap-2">
            <Label
              htmlFor={`opt-${opt.value}`}
              className="cursor-pointer font-normal"
            >
              {opt.label}
            </Label>
            <CustomYesNoSwitch
              id={`opt-${opt.value}`}
              checked={selected.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
            />
          </div>
        ))}
        {!selectOptions?.length && (
          <p className="text-xs text-muted-foreground">{t("noOptionsAvailable")}</p>
        )}
      </div>
    )
  }

  if (columnType === "select") {
    return (
      <Select
        value={Array.isArray(value) ? (value[0] ?? "") : value}
        onValueChange={(v) => onChange(v)}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder={t("selectValuePlaceholder")} />
        </SelectTrigger>
        <SelectContent>
          {(selectOptions ?? []).map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    )
  }

  if (columnType === "number") {
    const strValue = Array.isArray(value) ? "" : value
    const isInvalid = strValue !== "" && isNaN(Number(strValue))
    return (
      <div className="flex flex-col gap-1">
        <Input
          placeholder={t("valuePlaceholder")}
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={isInvalid}
          className={
            isInvalid ? "border-destructive focus-visible:ring-destructive" : ""
          }
        />
        {isInvalid && (
          <p className="text-xs text-destructive">{t("mustBeNumber")}</p>
        )}
      </div>
    )
  }

  if (columnType === "date") {
    return (
      <CustomDateInput
        value={Array.isArray(value) ? "" : value}
        onChange={onChange}
      />
    )
  }

  if (columnType === "datetime") {
    return (
      <CustomDateTimeInput
        value={Array.isArray(value) ? "" : value}
        onChange={onChange}
      />
    )
  }

  if (columnType === "time") {
    return (
      <CustomTimeInput
        value={Array.isArray(value) ? "" : value}
        onChange={onChange}
      />
    )
  }

  return (
    <Input
      placeholder={t("valuePlaceholder")}
      value={Array.isArray(value) ? "" : value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
