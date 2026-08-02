"use client";

import { Input } from "@/framework/components/ui/input";
import { cn } from "@/framework/lib/utils";
import type { ComponentProps } from "react";
import type { FieldValues, Path } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { FormFieldBase } from "./FormFieldBase";

interface FormInputProps<T extends FieldValues> extends Omit<
  ComponentProps<typeof Input>,
  "name" | "id"
> {
  name: Path<T>;
  label: string;
  id?: string;
  className?: string;
  inputClassName?: string;
}

export function FormInput<T extends FieldValues>({
  name,
  label,
  id,
  className,
  inputClassName,

  ...inputProps
}: FormInputProps<T>) {
  const { control } = useFormContext<T>();
  const isNumber = inputProps.type === "number";

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
          <Input
            {...inputProps}
            {...field}
            onChange={
              isNumber
                ? (e) => {
                    const raw = e.target.value;
                    field.onChange(raw === "" ? "" : e.target.valueAsNumber);
                  }
                : field.onChange
            }
            id={id ?? name}
            className={cn(
              fieldState.error &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
              inputProps.readOnly &&
                "bg-muted text-muted-foreground cursor-default",
              inputClassName,
            )}
          />
        </FormFieldBase>
      )}
    />
  );
}
