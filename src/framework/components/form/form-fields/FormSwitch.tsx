"use client"

import { CustomYesNoSwitch } from "@/framework/components/ui/CustomYesNoSwitch"
import type { ComponentProps } from "react"
import type { FieldValues, Path } from "react-hook-form"
import { Controller, useFormContext } from "react-hook-form"
import { FormFieldBase } from "./FormFieldBase"

interface FormSwitchProps<T extends FieldValues> extends Omit<
  ComponentProps<typeof CustomYesNoSwitch>,
  "name" | "checked" | "onCheckedChange"
> {
  name: Path<T>
  label: string
  id?: string
  className?: string
}

export function FormSwitch<T extends FieldValues>({
  name,
  label,
  id,
  className,

  ...switchProps
}: FormSwitchProps<T>) {
  const { control } = useFormContext<T>()

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
          <CustomYesNoSwitch
            {...switchProps}
            id={id ?? name}
            checked={field.value}
            onCheckedChange={field.onChange}
          />
        </FormFieldBase>
      )}
    />
  )
}
