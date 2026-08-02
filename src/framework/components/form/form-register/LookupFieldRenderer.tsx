"use client";

import { useState } from "react";

import { Combobox } from "@/framework/components/ui/combobox";
import { Input } from "@/framework/components/ui/input";
import { Textarea } from "@/framework/components/ui/textarea";
import { YesNoSwitch } from "@/framework/components/ui/yes-no-switch";
import { cn } from "@/framework/lib/utils";

import { DateInput } from "@/framework/components/ui/date-input";
import { FormFieldBase } from "../form-fields/FormFieldBase";
import { FormLookupInput } from "../form-fields/FormLookupInput";
import {
  useLookupField,
  resolveDisplayValue,
  type DisplayField,
} from "../hooks/useLookupfield";
import type { FieldCondition } from "../types/types";
import { spanClass } from "./FieldRenderer";
import { DateTimeInput } from "@/framework/components/ui/date-time-input";
import { TimeInput } from "@/framework/components/ui/time-input";

export interface LookupFieldConfig {
  type: "lookup";
  name: string;
  label: string;
  span?: number;
  className?: string;
  disabled?: boolean | FieldCondition;
  resource: string;
  displayFields?: DisplayField[];
}

export function DisplayFieldRenderer({
  field,
  value,
  activeCols,
}: {
  field: DisplayField;
  value: unknown;
  activeCols?: number;
}) {
  const strValue = value !== null && value !== undefined ? String(value) : "";
  const className = cn(spanClass(field.span, activeCols));

  if (field.type === "switch") {
    return (
      <FormFieldBase label={field.label} className={className}>
        <YesNoSwitch checked={value === true || strValue === "true"} disabled />
      </FormFieldBase>
    );
  }

  if (field.type === "combobox" && field.options) {
    return (
      <FormFieldBase label={field.label} className={className}>
        <Combobox
          items={field.options}
          value={strValue}
          readOnly
          className="bg-muted text-muted-foreground cursor-default"
        />
      </FormFieldBase>
    );
  }

  if (field.type === "select" && field.options) {
    const selectedLabel =
      field.options.find((o) => o.value === strValue)?.label ?? strValue;
    return (
      <FormFieldBase label={field.label} className={className}>
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
      <FormFieldBase label={field.label} className={className}>
        <Textarea
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
      <FormFieldBase label={field.label} className={className}>
        <DateInput value={strValue} readOnly />
      </FormFieldBase>
    );
  }

  if (field.type === "time") {
    return (
      <FormFieldBase label={field.label} className={className}>
        <TimeInput value={strValue} readOnly />
      </FormFieldBase>
    );
  }

  if (field.type === "datetime") {
    return (
      <FormFieldBase label={field.label} className={className}>
        <DateTimeInput value={strValue} readonly />
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
      <FormFieldBase label={field.label} className={className}>
        <Textarea
          className="bg-muted text-muted-foreground cursor-default font-mono text-xs"
          maxRows={field.maxRows}
          value={formatted}
          readOnly
        />
      </FormFieldBase>
    );
  }

  return (
    <FormFieldBase label={field.label} className={className}>
      <Input
        className="bg-muted text-muted-foreground cursor-default"
        value={strValue}
        readOnly
      />
    </FormFieldBase>
  );
}

// ─────────────────────────────────────────────
// LookupFieldRenderer
// ─────────────────────────────────────────────

export function LookupFieldRenderer({
  field,
  disabled,
  activeCols,
}: {
  field: LookupFieldConfig;
  disabled?: boolean | FieldCondition;
  activeCols?: number;
}) {
  const [open, setOpen] = useState(false);
  const rawDisabled = typeof disabled === "function" ? disabled() : disabled;
  const isDisabled =
    rawDisabled ||
    (typeof field.disabled === "function" ? field.disabled() : field.disabled);

  const {
    displayRecord,
    handleSelect,
    handleClear,
    displayFields,
    LookupDialog,
  } = useLookupField({
    fieldName: field.name,
    resourceId: field.resource,
    displayFields: field.displayFields,
  });

  return (
    <>
      <FormLookupInput
        name={field.name}
        label={field.label}
        displayKey="id"
        disabled={isDisabled}
        className={cn(spanClass(field.span, activeCols), field.className)}
        setOpen={isDisabled ? undefined : setOpen}
        onClear={handleClear}
      />

      {displayFields.map((df) => (
        <DisplayFieldRenderer
          key={df.from}
          field={df}
          value={resolveDisplayValue(df, displayRecord)}
          activeCols={activeCols}
        />
      ))}

      {!isDisabled && LookupDialog && open && (
        <LookupDialog open={open} setOpen={setOpen} onSelect={handleSelect} />
      )}
    </>
  );
}
