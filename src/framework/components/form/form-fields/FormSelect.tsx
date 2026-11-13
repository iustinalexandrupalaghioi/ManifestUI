"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { cn } from "@/framework/lib/utils";
import type { FieldValues, Path } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { useTranslations } from "next-intl";
import { FormFieldBase } from "./FormFieldBase";

interface SelectOption {
  value: string;
  label: string;
}

interface FormSelectProps<T extends FieldValues> {
  name: Path<T>;
  label: string;
  options: SelectOption[];
  placeholder?: string;
  id?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export function FormSelect<T extends FieldValues>({
  name,
  label,
  options,
  placeholder,
  id,
  className,
  disabled,
  readOnly,
}: FormSelectProps<T>) {
  const { control } = useFormContext<T>();
  const t = useTranslations("DataView");
  const resolvedPlaceholder = placeholder ?? t("selectOption");

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        if (readOnly) {
          const selectedLabel =
            options.find((o) => o.value === field.value)?.label ?? "";

          return (
            <FormFieldBase label={label} id={id ?? name} className={className}>
              <Input
                id={id ?? name}
                value={selectedLabel}
                readOnly
                className="bg-muted text-muted-foreground cursor-default"
              />
            </FormFieldBase>
          );
        }

        return (
          <FormFieldBase
            label={label}
            id={id ?? name}
            error={fieldState.error?.message}
            className={className}
          >
            <Select
              key={field.value}
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                id={id ?? name}
                className={cn(
                  "w-full",
                  fieldState.error &&
                    "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
                )}
              >
                <SelectValue placeholder={resolvedPlaceholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormFieldBase>
        );
      }}
    />
  );
}
