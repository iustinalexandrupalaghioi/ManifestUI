"use client";

import { CustomTextarea } from "@/framework/components/ui/CustomTextarea";
import { cn } from "@/framework/lib/utils";
import type { ComponentProps } from "react";
import type { FieldValues, Path } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { FormFieldBase } from "./FormFieldBase";

interface FormTextareaProps<T extends FieldValues> extends Omit<
  ComponentProps<typeof CustomTextarea>,
  "name" | "id"
> {
  name: Path<T>;
  label: string;
  id?: string;
  className?: string;
  inputClassName?: string;

  maxRows?: number;
}

export function FormTextarea<T extends FieldValues>({
  name,
  label,
  id,
  className,
  inputClassName,

  maxRows,
  ...textareaProps
}: FormTextareaProps<T>) {
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
          <CustomTextarea
            {...textareaProps}
            {...field}
            maxRows={maxRows}
            id={id ?? name}
            className={cn(
              fieldState.error &&
                "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
              "scrollbar-thumb-rounded scrollbar-thin overflow-y-auto px-4 py-2 scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80",
              textareaProps.readOnly &&
                "bg-muted text-muted-foreground cursor-default",
              inputClassName,
            )}
          />
        </FormFieldBase>
      )}
    />
  );
}
