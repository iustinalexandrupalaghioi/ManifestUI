"use client";

import { DateInput } from "@/framework/components/ui/date-input";
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
          <DateInput
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
                  message: "Date must be in dd-MM-yyyy format",
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
