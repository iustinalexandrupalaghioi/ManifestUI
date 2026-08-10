import type { ReactNode } from "react";
import type { DisplayField } from "../hooks/useLookupfield";
import type { FileFieldConfig } from "../hooks/useFileField";
import type { FilterInput } from "@/framework/components/data-view/features/filtering";
import type { TranslatableText } from "@/framework/types/i18n-types";

// ─────────────────────────────────────────────
// Field configs
// ─────────────────────────────────────────────

export type FieldConfig<TFormValues> =
  | InputFieldConfig<TFormValues>
  | TextareaFieldConfig<TFormValues>
  | SwitchFieldConfig<TFormValues>
  | SelectFieldConfig<TFormValues>
  | ComboboxFieldConfig<TFormValues>
  | DateFieldConfig<TFormValues>
  | TimeFieldConfig<TFormValues>
  | DateTimeFieldConfig<TFormValues>
  | ReadonlyFieldConfig<TFormValues>
  | LookupFieldConfig<TFormValues>
  | JsonFieldConfig<TFormValues>
  | FileFieldConfig
  | CustomFieldConfig<TFormValues>;

export type FieldCondition<TFormValues = Record<string, unknown>> = (
  item?: TFormValues,
) => boolean;

export type PickupFillField =
  | (DisplayField & { readonly: true; to?: never })
  | (Omit<DisplayField, "label"> & {
      label?: string;
      to: string;
      readonly?: false;
    });

export interface PickupConfig<TFormValues> {
  resource: string;
  mapField: string;
  targetField: string;
  embeddedField?: string;
  fillFields?: PickupFillField[];
  preFilters?: FilterInput[] | ((formValues: TFormValues) => FilterInput[]);
}

export interface BaseField<TFormValues> {
  name: string;
  label: TranslatableText;
  span?: number;
  className?: string;
  disabled?: boolean | FieldCondition;
  hidden?: boolean | FieldCondition;
  pickup?: PickupConfig<TFormValues>;
  readonly?: boolean | FieldCondition;
}

export interface InputFieldConfig<TFormValues> extends BaseField<TFormValues> {
  type: "input";
  inputType?: "text" | "number" | "email" | "tel" | "password";
  placeholder?: string;
  min?: number;
  max?: number;
}

export interface TextareaFieldConfig<
  TFormValues,
> extends BaseField<TFormValues> {
  type: "textarea";
  placeholder?: string;
  maxRows?: number;
}

export interface SwitchFieldConfig<TFormValues> extends BaseField<TFormValues> {
  type: "switch";
}

export interface SelectFieldConfig<TFormValues> extends BaseField<TFormValues> {
  type: "select";
  options: { value: string; label: string }[];
  placeholder?: string;
}

export interface ComboboxFieldConfig<
  TFormValues,
> extends BaseField<TFormValues> {
  type: "combobox";
  options: { value: string; label: string }[];
  placeholder?: string;
}

export interface DateFieldConfig<TFormValues> extends BaseField<TFormValues> {
  type: "date";
}

export interface TimeFieldConfig<TFormValues> extends BaseField<TFormValues> {
  type: "time";
  intervalMinutes?: number;
}

export interface DateTimeFieldConfig<
  TFormValues,
> extends BaseField<TFormValues> {
  type: "datetime";
}

export type ReadonlyDataType =
  | "text"
  | "number"
  | "date"
  | "datetime"
  | "time"
  | "select"
  | "switch"
  | "combobox"
  | "textarea"
  | "json";

export interface ReadonlyFieldConfig<
  TFormValues,
> extends BaseField<TFormValues> {
  type: "readonly";
  name: string;
  label: TranslatableText;
  dataType?: ReadonlyDataType;
  maxRows?: number;
  options?: { value: string; label: string }[];
}

export interface LookupFieldConfig<TFormValues> extends BaseField<TFormValues> {
  type: "lookup";
  resource: string;
  displayFields?: DisplayField[];
}

export interface CustomFieldConfig<TFormValues> extends Omit<
  BaseField<TFormValues>,
  "label"
> {
  type: "custom";
  label?: string;
  render: (item?: Record<string, unknown>) => ReactNode;
}

export interface JsonFieldConfig<TFormValues> extends BaseField<TFormValues> {
  type: "json";
  placeholder?: string;
  maxRows?: number;
}

// ─────────────────────────────────────────────
// Section configs
// ─────────────────────────────────────────────

export type SectionConfig<TFormValues> =
  | FieldSectionConfig<TFormValues>
  | SlotSectionConfig
  | CustomSectionConfig;

export interface FieldSectionConfig<TFormValues> {
  type?: "fields";
  title?: string;
  cols: number;
  fields: FieldConfig<TFormValues>[];
  className?: string;
}

export interface SlotSectionConfig {
  type: "slot";
  name: string;
}

export interface CustomSectionConfig {
  type: "custom";
  name: string;
  hidden?: boolean | FieldCondition;
  render: (item?: Record<string, unknown>) => ReactNode;
}

// ─────────────────────────────────────────────
// Layout + form config
// ─────────────────────────────────────────────

export interface ColumnLayout<TFormValues> {
  column: "left" | "right" | number | string;
  sections: SectionConfig<TFormValues>[];
}

export type FormLayoutConfig<TFormValues> =
  | { mode: "stack"; sections: SectionConfig<TFormValues>[] }
  | {
      mode: "grid";
      cols: number;
      areas: string;
      columns: ColumnLayout<TFormValues>[];
    };

export interface FormConfig<TFormValues> {
  layout: FormLayoutConfig<TFormValues>;
  className?: string;
}
