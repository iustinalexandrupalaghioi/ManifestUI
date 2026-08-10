"use client";

import { CustomCombobox } from "@/framework/components/ui/CustomCombobox";
import { cn } from "@/framework/lib/utils";
import type { Enum } from "@/framework/types/global/Enum";
import type { FieldValues, Path } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { FormFieldBase } from "./FormFieldBase";

interface FormComboboxProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: Enum[];
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function FormCombobox<T extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  id,
  className,
  disabled,
  readOnly,
}: FormComboboxProps<T>) {
  const { control } = useFormContext<T>();

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
          <CustomCombobox
            ref={field.ref}
            items={options}
            value={field.value}
            onChange={field.onChange}
            placeholder={placeholder}
            disabled={disabled}
            readOnly={readOnly}
            className={cn(
              "w-full",
              readOnly && "bg-muted text-muted-foreground cursor-default",
              fieldState.error &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
            )}
          />
        </FormFieldBase>
      )}
    />
  );
}
