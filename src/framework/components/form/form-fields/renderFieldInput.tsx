import { FormCombobox } from "./FormCombobox";
import { FormDate } from "./FormDate";
import { FormDateTime } from "./FormDateTime";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { FormSwitch } from "./FormSwitch";
import { FormTextarea } from "./FormTextarea";
import { FormTimeInput } from "./FormTimeInput";
import type { FieldConfig } from "../types/types";
import { resolveLabel, resolveOptions } from "@/framework/lib/resolveLabel";

/**
 * The subset of FieldConfig variants that are "plain inputs" — they render a
 * single RHF-connected control and are eligible to be wrapped by
 * FieldWithPickup (see BaseField.pickup). Everything else (readonly, lookup,
 * json, file, custom) has rendering needs specific enough that it stays
 * handled directly in FieldRenderer instead of going through here.
 */
export type BasicFieldConfig<TFormValues> = Extract<
  FieldConfig<TFormValues>,
  { type: "input" | "textarea" | "switch" | "select" | "combobox" | "date" | "time" | "datetime" }
>;

export function isBasicFieldConfig<TFormValues>(
  field: FieldConfig<TFormValues>,
): field is BasicFieldConfig<TFormValues> {
  return (
    field.type === "input" ||
    field.type === "textarea" ||
    field.type === "switch" ||
    field.type === "select" ||
    field.type === "combobox" ||
    field.type === "date" ||
    field.type === "time" ||
    field.type === "datetime"
  );
}

export interface RenderFieldInputOptions {
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  locale: string;
}

/**
 * Single source of truth for rendering the eight "basic" field types.
 *
 * This used to be duplicated: once in FieldRenderer's if-chain, and again in
 * FormFieldWithPickup's renderPickupField — and the two had drifted apart
 * (the pickup path silently dropped `readOnly` for several types). Both
 * callers now go through this one function, so there is exactly one place
 * to add a new basic field type or fix how an existing one renders.
 */
export function renderFieldInput<TFormValues>(
  field: BasicFieldConfig<TFormValues>,
  { disabled, readOnly, className, locale }: RenderFieldInputOptions,
) {
  const label = resolveLabel(field.label, locale);

  switch (field.type) {
    case "input":
      return (
        <FormInput
          name={field.name as any}
          label={label}
          type={field.inputType ?? "text"}
          placeholder={field.placeholder}
          min={field.min}
          max={field.max}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        />
      );

    case "textarea":
      return (
        <FormTextarea
          name={field.name as any}
          label={label}
          placeholder={field.placeholder}
          maxRows={field.maxRows}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        />
      );

    case "switch":
      return (
        <FormSwitch
          name={field.name as any}
          label={label}
          disabled={disabled || readOnly}
          className={className}
        />
      );

    case "select":
      return (
        <FormSelect
          name={field.name as any}
          label={label}
          options={resolveOptions(field.options, locale) ?? []}
          placeholder={field.placeholder}
          disabled={disabled || readOnly}
          readOnly={readOnly}
          className={className}
        />
      );

    case "combobox":
      return (
        <FormCombobox
          name={field.name as any}
          label={label}
          options={resolveOptions(field.options, locale) ?? []}
          placeholder={field.placeholder}
          disabled={disabled || readOnly}
          readOnly={readOnly}
          className={className}
        />
      );

    case "date":
      return (
        <FormDate
          name={field.name as any}
          label={label}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        />
      );

    case "time":
      return (
        <FormTimeInput
          name={field.name as any}
          label={label}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        />
      );

    case "datetime":
      return (
        <FormDateTime
          name={field.name as any}
          label={label}
          disabled={disabled}
          readOnly={readOnly}
          className={className}
        />
      );
  }
}
