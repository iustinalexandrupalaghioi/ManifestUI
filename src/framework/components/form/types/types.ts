import type { ReactNode } from "react";
import type { DisplayField } from "../lib/pickupDisplayField";
import type { FileFieldConfig } from "../hooks/useFileField";
import type { FilterInput } from "@/framework/components/data-view/features/filtering";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { EnumOptions } from "@/framework/lib/resolveLabel";
import type { FormRegions, LayoutNode, Placement } from "./layout-types";
import type { BlockExtensionRef, FieldExtensionRef } from "@/framework/extensions/registry";

export type * from "./layout-types";

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
  | JsonFieldConfig<TFormValues>
  | FileFieldConfig
  | CustomFieldConfig<TFormValues>
  | ExtensionFieldConfig<TFormValues>;

/** A registered field component (`defineFieldComponent`). */
export type ExtensionFieldConfig<TFormValues> = BaseField<TFormValues> & FieldExtensionRef;

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
  /**
   * `mode: "free"` only: columns of the small grid that holds the read-only
   * `fillFields` under the field. Defaults to the largest `span` among them.
   * (Stack/grid layouts lay them out in the section's own columns.)
   */
  fillCols?: number;
  /**
   * `mode: "free"` only. `"none"` hides the read-only `fillFields` that are
   * normally drawn under the field, because you place them yourself with
   * `pickupvalue` nodes. Default `"below"`.
   */
  fillDisplay?: "below" | "none";
  preFilters?: FilterInput[] | ((formValues: TFormValues) => FilterInput[]);
}

/**
 * Every field also accepts all `Placement` props (span, rowSpan, col, row,
 * area, order, alignSelf, grow, basis, hidden, className, style). Responsive
 * and area/row placement only take effect in `mode: "free"` layouts.
 */
export interface BaseField<TFormValues> extends Placement {
  name: string;
  label: TranslatableText;
  disabled?: boolean | FieldCondition;
  pickup?: PickupConfig<TFormValues>;
  readonly?: boolean | FieldCondition;
  /** Label becomes a toggle that hides the input (kept mounted). */
  collapsible?: boolean;
  defaultCollapsed?: boolean;
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
  options: EnumOptions;
  placeholder?: string;
}

export interface ComboboxFieldConfig<
  TFormValues,
> extends BaseField<TFormValues> {
  type: "combobox";
  options: EnumOptions;
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
  options?: EnumOptions;
}

export interface CustomFieldConfig<TFormValues> extends Omit<
  BaseField<TFormValues>,
  "label" | "collapsible" | "defaultCollapsed"
> {
  type: "custom";
  label?: string;
  /** Receives `{ ...item, ...liveFormValues }` and, optionally, the original item. */
  render: (
    item?: Record<string, unknown>,
    sourceItem?: Record<string, unknown>,
  ) => ReactNode;
  /**
   * Fields your `render` draws, declared so the framework can find them
   * (grid inline-editing, pickup lookups). Optional.
   */
  fields?: FieldConfig<TFormValues>[];
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
  | CustomSectionConfig<TFormValues>
  | ExtensionSectionConfig<TFormValues>;

/** A registered block component (`defineBlockComponent`) used as a section. */
export type ExtensionSectionConfig<TFormValues> = BlockExtensionRef & {
  hidden?: boolean | FieldCondition;
  /** Fields the block edits, so grid inline-editing and pickups can find them. */
  fields?: FieldConfig<TFormValues>[];
};

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

export interface CustomSectionConfig<TFormValues = Record<string, unknown>> {
  type: "custom";
  name: string;
  hidden?: boolean | FieldCondition;
  render: (item?: Record<string, unknown>) => ReactNode;
  fields?: FieldConfig<TFormValues>[];
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
    }
  /**
   * Free-form layout: a tree of containers, fields, buttons and content
   * nodes. See `docs/form-layout.md`.
   */
  | { mode: "free"; root: LayoutNode<TFormValues> };

export interface FormConfig<TFormValues> {
  layout: FormLayoutConfig<TFormValues>;
  /** Header / footer / floating areas (buttons etc.). Any layout mode. */
  regions?: FormRegions<TFormValues>;
  className?: string;
}
