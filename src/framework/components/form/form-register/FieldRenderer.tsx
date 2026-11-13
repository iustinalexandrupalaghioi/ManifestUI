import { cn } from "@/framework/lib/utils";
import { useFormContext, useWatch } from "react-hook-form";
import { useLocale } from "next-intl";
import { resolveLabel, resolveOptions } from "@/framework/lib/resolveLabel";
import type { ExtensionFieldConfig, FieldConfig, Resp } from "../types/types";
import { getFieldExtension } from "@/framework/extensions/registry";
import { ExtensionField } from "@/framework/extensions/renderers";
import { FileFieldRenderer } from "./FileFieldRenderer";

import { FieldWithPickup } from "../form-fields/FormFieldWithPickup";
import FormReadOnlyInput from "../form-fields/FormReadOnlyInput";
import { FormJsonTextarea } from "../form-fields/FormJsonTextarea";
import { FieldCollapseProvider } from "../form-fields/FieldCollapseContext";
import { isBasicFieldConfig, renderFieldInput } from "../form-fields/renderFieldInput";

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

export function spanClass(span?: Resp<number>, activeCols?: number) {
  // Responsive spans ({ base, md, ... }) are resolved by the free-layout
  // frame via inline styles; the class-based path only handles plain numbers.
  if (typeof span === "object") return "";
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

  const collapse = (input: React.ReactNode) => (
    <FieldCollapseProvider
      collapsible={"collapsible" in field ? field.collapsible : undefined}
      defaultCollapsed={"defaultCollapsed" in field ? field.defaultCollapsed : undefined}
    >
      {input}
    </FieldCollapseProvider>
  );

  const extension = getFieldExtension(field.type);
  if (extension) {
    return collapse(
      <ExtensionField
        def={extension}
        field={field as ExtensionFieldConfig<TFormValues>}
        item={item}
        disabled={!!isDisabled}
        readOnly={isReadOnly}
        className={className}
      />,
    );
  }

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
    return <div className={className}>{field.render(context, item)}</div>;
  }

  if (field.type === "readonly") {
    return collapse(
      <FormReadOnlyInput
        name={field.name}
        label={resolveLabel(field.label, locale)}
        item={item}
        className={className}
        dataType={field.dataType}
        maxRows={field.maxRows}
        options={resolveOptions(field.options, locale)}
      />,
    );
  }

  if (isBasicFieldConfig(field)) {
    return collapse(
      renderFieldInput(field, {
        disabled: isDisabled,
        readOnly: isReadOnly,
        className,
        locale,
      }),
    );
  }

  if (field.type === "json") {
    return collapse(
      <FormJsonTextarea
        name={field.name}
        label={resolveLabel(field.label, locale)}
        placeholder={field.placeholder}
        maxRows={field.maxRows}
        disabled={isDisabled}
        readOnly={isReadOnly}
        className={className}
      />,
    );
  }

  if (field.type === "file") {
    return (
      <FileFieldRenderer
        field={field}
        disabled={isDisabled || isReadOnly}
        activeCols={activeCols}
      />
    );
  }

  console.warn(
    `[FieldRenderer] Unknown field type: "${(field as { type: string }).type}". Register it with registerExtensions.`,
  );
  return null;
}
