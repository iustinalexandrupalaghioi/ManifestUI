import { DateInput } from "@/framework/components/ui/date-input"
import { DateTimeInput } from "@/framework/components/ui/date-time-input"
import { Input } from "@/framework/components/ui/input"
import { Label } from "@/framework/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/framework/components/ui/select"
import { TimeInput } from "@/framework/components/ui/time-input"
import { YesNoSwitch } from "@/framework/components/ui/yes-no-switch"
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
          columnType === "number" ? "1, 2, 3..." : "value1, value2..."
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
            <YesNoSwitch
              id={`opt-${opt.value}`}
              checked={selected.includes(opt.value)}
              onCheckedChange={() => toggle(opt.value)}
            />
          </div>
        ))}
        {!selectOptions?.length && (
          <p className="text-xs text-muted-foreground">No options available.</p>
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
          <SelectValue placeholder="Select value..." />
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
          placeholder="Value..."
          value={strValue}
          onChange={(e) => onChange(e.target.value)}
          aria-invalid={isInvalid}
          className={
            isInvalid ? "border-destructive focus-visible:ring-destructive" : ""
          }
        />
        {isInvalid && (
          <p className="text-xs text-destructive">Must be a number</p>
        )}
      </div>
    )
  }

  if (columnType === "date") {
    return (
      <DateInput
        value={Array.isArray(value) ? "" : value}
        onChange={onChange}
      />
    )
  }

  if (columnType === "datetime") {
    return (
      <DateTimeInput
        value={Array.isArray(value) ? "" : value}
        onChange={onChange}
      />
    )
  }

  if (columnType === "time") {
    return (
      <TimeInput
        value={Array.isArray(value) ? "" : value}
        onChange={onChange}
      />
    )
  }

  return (
    <Input
      placeholder="Value..."
      value={Array.isArray(value) ? "" : value}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}
