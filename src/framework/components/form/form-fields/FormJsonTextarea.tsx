"use client";

import { Textarea } from "@/framework/components/ui/textarea";
import { cn } from "@/framework/lib/utils";
import type { ComponentProps } from "react";
import { useEffect, useState } from "react";
import type { FieldValues, Path } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { FormFieldBase } from "./FormFieldBase";

interface FormJsonTextareaProps<T extends FieldValues> extends Omit<
  ComponentProps<typeof Textarea>,
  "name" | "id" | "value" | "onChange"
> {
  name: Path<T>;
  label: string;
  id?: string;
  className?: string;
  inputClassName?: string;
}

function stringify(value: unknown): string {
  if (value === undefined || value === null || value === "") return "";
  if (typeof value === "string") {
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return "";
  }
}

export function FormJsonTextarea<T extends FieldValues>({
  name,
  label,
  id,
  className,
  inputClassName,
  ...textareaProps
}: FormJsonTextareaProps<T>) {
  const { control } = useFormContext<T>();

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
        <JsonTextareaField
          field={field}
          fieldState={fieldState}
          label={label}
          id={id ?? name}
          className={className}
          inputClassName={inputClassName}
          textareaProps={textareaProps}
        />
      )}
    />
  );
}

function JsonTextareaField({
  field,
  fieldState,
  label,
  id,
  className,
  inputClassName,
  textareaProps,
}: {
  field: {
    value: unknown;
    onChange: (value: unknown) => void;
    onBlur: () => void;
    name: string;
  };
  fieldState: { error?: { message?: string } };
  label: string;
  id: string;
  className?: string;
  inputClassName?: string;
  textareaProps: Omit<
    ComponentProps<typeof Textarea>,
    "name" | "id" | "value" | "onChange"
  >;
}) {
  const [text, setText] = useState(() => stringify(field.value));
  const [parseError, setParseError] = useState<string | null>(null);

  // Re-sync local text when the form value changes externally
  // (reset, pickup-fill, initial load) — not on every keystroke.
  useEffect(() => {
    setText(stringify(field.value));
    setParseError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [field.value]);

  function handleChange(raw: string) {
    setText(raw);
    if (raw.trim() === "") {
      setParseError(null);
      field.onChange(null);
      return;
    }
    try {
      const parsed = JSON.parse(raw);
      setParseError(null);
      field.onChange(parsed);
    } catch {
      setParseError("Invalid JSON");
    }
  }

  return (
    <FormFieldBase
      label={label}
      id={id}
      error={fieldState.error?.message ?? parseError ?? undefined}
      className={className}
    >
      <Textarea
        {...textareaProps}
        id={id}
        name={field.name}
        value={text}
        onChange={(e) => handleChange(e.target.value)}
        onBlur={field.onBlur}
        className={cn(
          "font-mono text-xs",
          (fieldState.error || parseError) &&
            "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
          textareaProps.readOnly &&
            "bg-muted text-muted-foreground cursor-default",
          inputClassName,
        )}
      />
    </FormFieldBase>
  );
}
