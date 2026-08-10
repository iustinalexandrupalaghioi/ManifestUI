import { cn } from "@/framework/lib/utils";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale } from "next-intl";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { FieldConfig } from "../types/types";
import { FileFieldRenderer } from "./FileFieldRenderer";
import { LookupFieldRenderer } from "./LookupFieldRenderer";

import { FieldWithPickup } from "../form-fields/FormFieldWithPickup";
import FormReadOnlyInput from "../form-fields/FormReadOnlyInput";
import { FormJsonTextarea } from "../form-fields/FormJsonTextarea";
import { isBasicFieldConfig, renderFieldInput } from "../form-fields/renderFieldInput";

// ─────────────────────────────────────────────
// Custom field type registry
// ─────────────────────────────────────────────

type CustomFieldComponent<TFormValues> = (props: {
  field: FieldConfig<TFormValues>;
  item?: Record<string, unknown>;
}) => React.ReactNode;

const registry = new Map<string, CustomFieldComponent<any>>();

export function registerFieldType<TFormValues>(
  type: string,
  component: CustomFieldComponent<TFormValues>,
) {
  registry.set(type, component);
}

// ─────────────────────────────────────────────
// Span helper
// ─────────────────────────────────────────────

// Literal class lookup so Tailwind's JIT scanner can find every possible
// class string in source — never build "col-span-N" dynamically.
const COL_SPAN_CLASS: Record<number, string> = {
  1: "",
  2: "col-span-2",
  3: "col-span-3",
  4: "col-span-4",
};

export function spanClass(span?: number, activeCols?: number) {
  const requested = span && span > 1 ? span : 1;

  if (activeCols === undefined) {
    // Legacy fallback: no measured column count supplied.
    return COL_SPAN_CLASS[Math.min(requested, 4)] ?? "";
  }

  const clamped = Math.min(requested, activeCols);
  return COL_SPAN_CLASS[clamped] ?? "";
}

// ─────────────────────────────────────────────
// FieldRenderer
// ─────────────────────────────────────────────

interface FieldRendererProps<TFormValues> {
  field: FieldConfig<TFormValues>;
  item?: Record<string, unknown>;
  disabled?: boolean;
  readOnly?: boolean;
  activeCols?: number;
}

export function FieldRenderer<TFormValues extends Record<string, any>>({
  field,
  item,
  disabled,
  readOnly,
  activeCols,
}: FieldRendererProps<TFormValues>) {
  const { control } = useFormContext<TFormValues>();
  const values = useWatch({ control });
  const locale = useLocale();

  const context = { ...item, ...values } as Record<string, unknown>;

  const fieldDisabled = "disabled" in field ? field.disabled : false;
  const isDisabled =
    disabled ||
    (typeof fieldDisabled === "function"
      ? fieldDisabled(context)
      : fieldDisabled);

  const fieldHidden = "hidden" in field ? field.hidden : false;
  const isHidden =
    typeof fieldHidden === "function" ? fieldHidden(context) : fieldHidden;

  const fieldReadOnly = "readonly" in field ? field.readonly : false;
  const isReadOnly =
    !!readOnly ||
    (typeof fieldReadOnly === "function"
      ? fieldReadOnly(context)
      : !!fieldReadOnly);

  if (isHidden) return null;

  const className = cn(
    spanClass(field.span, activeCols),
    "className" in field ? field.className : "",
  );

  if (field.type !== "custom" && field.type !== "file" && field.pickup) {
    return (
      <FieldWithPickup
        field={field as any}
        item={item}
        disabled={isDisabled}
        readOnly={isReadOnly}
        className={className}
        activeCols={activeCols}
        locale={locale}
      />
    );
  }

  if (field.type === "custom") {
    return <div className={className}>{field.render(item)}</div>;
  }

  if (field.type === "readonly") {
    return (
      <FormReadOnlyInput
        name={field.name}
        label={resolveLabel(field.label, locale)}
        item={item}
        className={className}
        dataType={field.dataType}
        maxRows={field.maxRows}
        options={field.options}
      />
    );
  }

  if (isBasicFieldConfig(field)) {
    return renderFieldInput(field, {
      disabled: isDisabled,
      readOnly: isReadOnly,
      className,
      locale,
    });
  }

  if (field.type === "json") {
    return (
      <FormJsonTextarea
        name={field.name}
        label={resolveLabel(field.label, locale)}
        placeholder={field.placeholder}
        maxRows={field.maxRows}
        disabled={isDisabled}
        readOnly={isReadOnly}
        className={className}
      />
    );
  }

  if (field.type === "file") {
    return (
      <FileFieldRenderer field={field} disabled={isDisabled || isReadOnly} />
    );
  }

  if (field.type === "lookup") {
    return (
      <LookupFieldRenderer
        field={field}
        disabled={isDisabled}
        activeCols={activeCols}
      />
    );
  }

  // Custom registered type (unreachable for the known FieldConfig union,
  // kept as a fallback for types registered dynamically via registerFieldType)
  const anyField = field as unknown as {
    type: string;
    name: string;
    span?: number;
    className?: string;
    disabled?: boolean;
  };

  const Custom = registry.get(anyField.type);

  if (Custom) {
    return (
      <div
        className={cn(spanClass(anyField.span, activeCols), anyField.className)}
      >
        <Custom field={field} item={item} />
      </div>
    );
  }

  console.warn(`[FieldRenderer] Unknown field type: "${anyField.type}"`);
  return null;
}
