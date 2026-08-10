"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { cn } from "@/framework/lib/utils"
import { SearchIcon, X } from "lucide-react"
import type { Dispatch, SetStateAction } from "react"
import {
  type FieldValues,
  type Path,
  Controller,
  useFormContext,
} from "react-hook-form"
import { useTranslations } from "next-intl"
import { FormFieldBase } from "./FormFieldBase"

interface FormLookupInputProps<T extends FieldValues> {
  name: Path<T>
  label: string
  displayKey: string
  id?: string
  placeholder?: string
  title?: string
  disabled?: boolean
  setOpen?: Dispatch<SetStateAction<boolean>>
  onClear?: () => void
  className?: string
  inputClassName?: string
}

function getDisplayValue(value: unknown, displayKey: string): string {
  if (!value) return ""
  if (typeof value === "object")
    return ((value as Record<string, unknown>)[displayKey] as string) ?? ""
  return String(value)
}

export function FormLookupInput<T extends FieldValues>({
  name,
  label,
  displayKey,
  id,
  placeholder,
  title,
  disabled = false,
  setOpen,
  onClear,
  className,
  inputClassName,
}: FormLookupInputProps<T>) {
  const { control } = useFormContext<T>()
  const t = useTranslations("DataView")

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <FormFieldBase
          label={label}
          id={id ?? name}
          error={fieldState.error?.message}
          className={className}
        >
          <div className="relative flex w-full items-center gap-2">
            <Input
              id={id ?? name}
              title={title}
              placeholder={placeholder}
              disabled={disabled}
              value={getDisplayValue(field.value, displayKey)}
              readOnly
              className={cn(
                fieldState.error &&
                  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
                inputClassName
              )}
            />
            {field.value !== null && field.value !== 0 && !disabled && (
              <button
                type="button"
                className="absolute right-14 text-muted-foreground hover:text-foreground"
                onClick={() => {
                  field.onChange(null)
                  onClear?.()
                }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
            {!disabled && setOpen && (
              <Button
                type="button"
                variant="ghost"
                title={t("lookup")}
                onClick={() => setOpen(true)}
                className="inline-flex"
              >
                <SearchIcon />
              </Button>
            )}
          </div>
        </FormFieldBase>
      )}
    />
  )
}
