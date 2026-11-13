"use client";

import { Controller, useFormContext } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useLocale } from "next-intl";
import { resolveOptions } from "@/framework/lib/resolveLabel";
import type { FieldConfig } from "@/framework/components/form/types/types";

export function DirectSelectCell({
  field,
  onOpenChange,
}: {
  field: Extract<FieldConfig<any>, { type: "select" }>;
  onOpenChange: (open: boolean) => void;
}) {
  const locale = useLocale();
  const { control } = useFormContext();
  const options = resolveOptions(field.options, locale) ?? [];

  return (
    <Controller
      control={control}
      name={field.name}
      render={({ field: rhfField }) => (
        <Select
          value={rhfField.value ?? ""}
          onValueChange={rhfField.onChange}
          onOpenChange={onOpenChange}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder={field.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}
