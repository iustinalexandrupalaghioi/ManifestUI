"use client";

import { Input } from "@/framework/components/ui/input";
import { Textarea } from "@/framework/components/ui/textarea";
import { DateInput } from "@/framework/components/ui/date-input";
import { TimeInput } from "@/framework/components/ui/time-input";
import { DateTimeInput } from "@/framework/components/ui/date-time-input";
import { YesNoSwitch } from "@/framework/components/ui/yes-no-switch";
import { FormFieldBase } from "./FormFieldBase";
import { cn } from "@/framework/lib/utils";
import type { ReadonlyDataType } from "../types/types";

interface FormReadOnlyInputProps {
  name: string;
  label: string;
  item?: Record<string, unknown>;
  className?: string;
  dataType?: ReadonlyDataType;
  maxRows?: number;
  options?: { value: string; label: string }[];
}

function FormReadOnlyInput({
  name,
  label,
  item,
  className,
  dataType = "text",
  maxRows,
  options,
}: FormReadOnlyInputProps) {
  const raw = item?.[name];

  switch (dataType) {
    case "date":
      return (
        <FormFieldBase label={label} className={className}>
          <DateInput value={raw as string} readOnly />
        </FormFieldBase>
      );

    case "time":
      return (
        <FormFieldBase label={label} className={className}>
          <TimeInput value={raw as string} readOnly className="w-full" />
        </FormFieldBase>
      );

    case "datetime":
      return (
        <FormFieldBase label={label} className={className}>
          <DateTimeInput value={raw as string} readonly />
        </FormFieldBase>
      );

    case "switch":
      return (
        <FormFieldBase label={label} className={className}>
          <YesNoSwitch checked={!!raw} disabled />
        </FormFieldBase>
      );

    case "select":
    case "combobox": {
      const selectedLabel =
        options?.find((o) => o.value === raw)?.label ?? String(raw ?? "");
      return (
        <FormFieldBase label={label} className={className}>
          <Input
            value={selectedLabel}
            readOnly
            className="bg-muted text-muted-foreground cursor-default"
          />
        </FormFieldBase>
      );
    }

    case "textarea":
      return (
        <FormFieldBase label={label} className={className}>
          <Textarea
            defaultValue={String(raw ?? "")}
            maxRows={maxRows}
            readOnly
            className="scrollbar-thumb-rounded scrollbar-thin overflow-y-auto bg-muted px-4 py-2 text-muted-foreground scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80"
          />
        </FormFieldBase>
      );

    case "json": {
      let text = "";
      try {
        if (raw != null) {
          const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
          text = JSON.stringify(parsed, null, 2);
        }
      } catch {
        text = String(raw ?? "");
      }
      return (
        <FormFieldBase label={label} className={className}>
          <Textarea
            defaultValue={text}
            maxRows={maxRows}
            readOnly
            className="scrollbar-thumb-rounded scrollbar-thin overflow-y-auto bg-muted px-4 py-2 font-mono text-xs text-muted-foreground scrollbar-thumb-primary scrollbar-track-muted/80 dark:scrollbar-track-muted/80"
          />
        </FormFieldBase>
      );
    }

    case "number":
    case "text":
    default:
      return (
        <FormFieldBase label={label} className={className}>
          <Input
            defaultValue={String(raw ?? "")}
            readOnly
            className="bg-muted text-muted-foreground cursor-default"
          />
        </FormFieldBase>
      );
  }
}

export default FormReadOnlyInput;
