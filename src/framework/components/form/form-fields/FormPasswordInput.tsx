"use client";

import { useState } from "react";
import { Eye, EyeOff, LockIcon } from "lucide-react";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { cn } from "@/framework/lib/utils";
import type { ComponentProps } from "react";
import type { FieldValues, Path } from "react-hook-form";
import { Controller, useFormContext } from "react-hook-form";
import { FormFieldBase } from "./FormFieldBase";

interface FormPasswordInputProps<T extends FieldValues> extends Omit<
  ComponentProps<typeof InputGroupInput>,
  "name" | "id" | "type"
> {
  name: Path<T>;
  label: string;
  id?: string;
  className?: string;
  inputClassName?: string;
}

export function FormPasswordInput<T extends FieldValues>({
  name,
  label,
  id,
  className,
  inputClassName,
  ...inputProps
}: FormPasswordInputProps<T>) {
  const { control } = useFormContext<T>();
  const [visible, setVisible] = useState(false);

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
          <InputGroup>
            <InputGroupAddon>
              <LockIcon className="h-4 w-4 text-gray-500" />
            </InputGroupAddon>
            <InputGroupInput
              {...inputProps}
              {...field}
              type={visible ? "text" : "password"}
              id={id ?? name}
              className={cn(
                fieldState.error &&
                  "border-destructive focus-visible:border-destructive focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40",
                inputClassName,
              )}
            />
            <InputGroupAddon align="inline-end">
              <InputGroupButton
                type="button"
                variant="ghost"
                onClick={() => setVisible((v) => !v)}
                tabIndex={-1}
              >
                {visible ? (
                  <EyeOff className="h-4 w-4 text-gray-500" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-500" />
                )}
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </FormFieldBase>
      )}
    />
  );
}
