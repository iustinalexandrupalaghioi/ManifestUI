"use client";

import { CustomDateTimeInput } from "@/framework/components/ui/CustomDateTimeInput";
import { useTranslations } from "next-intl";
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { FormFieldBase } from "./FormFieldBase";

interface FormDateTimeProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

function FormDateTime<T extends FieldValues>({
  name,
  label,
  id,
  className,
  inputClassName,
  disabled,
  readOnly,
}: FormDateTimeProps<T>) {
  const { control, setError, clearErrors } = useFormContext();
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
          <CustomDateTimeInput
            ref={field.ref}
            value={field.value}
            onChange={(val) => {
              clearErrors(name);
              field.onChange(val);
            }}
            onBlur={(hasFormatError) => {
              if (hasFormatError && !disabled && !readOnly) {
                setError(name, {
                  message: t("dateTimeFormat"),
                });
              }
              field.onBlur();
            }}
            disabled={disabled}
            readonly={readOnly}
            hasError={!!fieldState.error}
            className={inputClassName}
          />
        </FormFieldBase>
      )}
    />
  );
}

export { FormDateTime };
