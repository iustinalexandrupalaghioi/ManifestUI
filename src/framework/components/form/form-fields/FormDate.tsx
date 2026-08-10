"use client";

import { CustomDateInput } from "@/framework/components/ui/CustomDateInput";
import { useTranslations } from "next-intl";
import {
  Controller,
  useFormContext,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { FormFieldBase } from "./FormFieldBase";

interface FormDateProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  id?: string;
  className?: string;
  inputClassName?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

function FormDate<T extends FieldValues>({
  name,
  label,
  id,
  className,
  inputClassName,
  disabled,
  readOnly,
}: FormDateProps<T>) {
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
          <CustomDateInput
            ref={field.ref}
            id={id ?? name}
            value={field.value}
            onChange={(val) => {
              clearErrors(name);
              field.onChange(val);
            }}
            onBlur={(hasFormatError) => {
              if (hasFormatError && !disabled && !readOnly) {
                setError(name, {
                  message: t("dateFormat"),
                });
              }
              field.onBlur();
            }}
            disabled={disabled}
            readOnly={readOnly}
            hasError={!!fieldState.error}
            className={inputClassName}
          />
        </FormFieldBase>
      )}
    />
  );
}

export { FormDate };
