"use client";

import { useLocale } from "next-intl";

import { CustomCombobox } from "@/framework/components/ui/CustomCombobox";
import { Input } from "@/components/ui/input";
import { CustomTextarea } from "@/framework/components/ui/CustomTextarea";
import { CustomYesNoSwitch } from "@/framework/components/ui/CustomYesNoSwitch";
import { cn } from "@/framework/lib/utils";
import { resolveLabel, resolveOptions } from "@/framework/lib/resolveLabel";

import { CustomDateInput } from "@/framework/components/ui/CustomDateInput";
import { FormFieldBase } from "../form-fields/FormFieldBase";
import type { DisplayField } from "../lib/pickupDisplayField";
import { spanClass } from "./FieldRenderer";
import { CustomDateTimeInput } from "@/framework/components/ui/CustomDateTimeInput";
import { CustomTimeInput } from "@/framework/components/ui/CustomTimeInput";

export function DisplayFieldRenderer({
  field,
  value,
  activeCols,
}: {
  field: DisplayField;
  value: unknown;
  activeCols?: number;
}) {
  const locale = useLocale();
  const label = resolveLabel(field.label, locale);
  const strValue = value !== null && value !== undefined ? String(value) : "";
  const className = cn(spanClass(field.span, activeCols));
  const options = resolveOptions(field.options, locale);

  if (field.type === "switch") {
    return (
      <FormFieldBase label={label} className={className}>
        <CustomYesNoSwitch checked={value === true || strValue === "true"} disabled />
      </FormFieldBase>
    );
  }

  if (field.type === "combobox" && options) {
    return (
      <FormFieldBase label={label} className={className}>
        <CustomCombobox
          items={options}
          value={strValue}
          readOnly
          className="bg-muted text-muted-foreground cursor-default"
        />
      </FormFieldBase>
    );
  }

  if (field.type === "select" && options) {
    const selectedLabel =
      options.find((o) => o.value === strValue)?.label ?? strValue;
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

  if (field.type === "textarea") {
    return (
      <FormFieldBase label={label} className={className}>
        <CustomTextarea
          className="bg-muted text-muted-foreground cursor-default"
          maxRows={field.maxRows}
          value={strValue}
          readOnly
        />
      </FormFieldBase>
    );
  }
  if (field.type === "date") {
    return (
      <FormFieldBase label={label} className={className}>
        <CustomDateInput value={strValue} readOnly />
      </FormFieldBase>
    );
  }

  if (field.type === "time") {
    return (
      <FormFieldBase label={label} className={className}>
        <CustomTimeInput value={strValue} readOnly />
      </FormFieldBase>
    );
  }

  if (field.type === "datetime") {
    return (
      <FormFieldBase label={label} className={className}>
        <CustomDateTimeInput value={strValue} readonly />
      </FormFieldBase>
    );
  }

  if (field.type === "json") {
    let formatted = strValue;
    try {
      const parsed = typeof value === "string" ? JSON.parse(value) : value;
      formatted = JSON.stringify(parsed, null, 2);
    } catch {
      formatted = strValue;
    }

    return (
      <FormFieldBase label={label} className={className}>
        <CustomTextarea
          className="bg-muted text-muted-foreground cursor-default font-mono text-xs"
          maxRows={field.maxRows}
          value={formatted}
          readOnly
        />
      </FormFieldBase>
    );
  }

  return (
    <FormFieldBase label={label} className={className}>
      <Input
        className="bg-muted text-muted-foreground cursor-default"
        value={strValue}
        readOnly
      />
    </FormFieldBase>
  );
}
