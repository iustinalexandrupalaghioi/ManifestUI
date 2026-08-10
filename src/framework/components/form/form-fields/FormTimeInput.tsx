"use client";

import { CustomTimeInput } from "@/framework/components/ui/CustomTimeInput";
import { cn } from "@/framework/lib/utils";
import { useTranslations } from "next-intl";
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { FormFieldBase } from "./FormFieldBase";

interface FormTimeInputProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function FormTimeInput<T extends FieldValues>({
  name,
  label,
  id,
  className,
  disabled,
  readOnly,
}: FormTimeInputProps<T>) {
  const { control, setError, clearErrors } = useFormContext<T>();
  const t = useTranslations("Validation");

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
          <CustomTimeInput
            ref={field.ref}
            value={field.value}
            onChange={(val) => {
              clearErrors(name);
              field.onChange(val);
            }}
            onBlur={(hasFormatError) => {
              if (hasFormatError && !disabled && !readOnly) {
                setError(name, {
                  message: t("timeFormat"),
                });
              }
              field.onBlur();
            }}
            disabled={disabled}
            readOnly={readOnly}
            hasError={!!fieldState.error}
            className={cn("w-full", className)}
          />
        </FormFieldBase>
      )}
    />
  );
}
