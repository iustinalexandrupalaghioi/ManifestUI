import { getPickupConfig } from "@/framework/components/form/lib/flattenFormFields";
import { resolveDisplayValue } from "@/framework/components/form/lib/pickupDisplayField";
import { cn } from "@/framework/lib/utils";

export const SELECTABLE_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "tel",
  "password",
]);

export const FIELD_WRAPPER_CLASS = cn(
  "flex h-full w-full min-w-0 items-center px-1 text-xs",
  "[&_input]:!h-auto [&_input]:!min-h-0 [&_input]:!w-full [&_input]:!rounded-none [&_input]:!border-0",
  "[&_input]:!bg-transparent [&_input]:!p-0 [&_input]:!text-xs [&_input]:!shadow-none [&_input]:!ring-0",
  "[&_input]:!outline-none",
  "[&_textarea]:!h-auto [&_textarea]:!min-h-0 [&_textarea]:!w-full [&_textarea]:!resize-none [&_textarea]:!rounded-none",
  "[&_textarea]:!border-0 [&_textarea]:!bg-transparent [&_textarea]:!p-0 [&_textarea]:!text-xs",
  "[&_textarea]:!shadow-none [&_textarea]:!ring-0 [&_textarea]:!outline-none",
  "[&_textarea]:![field-sizing:fixed]",
  "[&_textarea]:!overflow-x-auto [&_textarea]:!overflow-y-hidden [&_textarea]:!whitespace-nowrap",
  "[&_textarea]:!scrollbar-none",
  "[&_[data-slot=select-trigger]]:!h-auto [&_[data-slot=select-trigger]]:!w-full",
  "[&_[data-slot=select-trigger]]:!rounded-none [&_[data-slot=select-trigger]]:!border-0",
  "[&_[data-slot=select-trigger]]:!bg-transparent [&_[data-slot=select-trigger]]:!p-0",
  "[&_[data-slot=select-trigger]]:!text-xs [&_[data-slot=select-trigger]]:!shadow-none",
  "[&_[data-slot=select-trigger]]:!ring-0",
  "[&_label]:!hidden [&_p]:!hidden",
);

export function buildPickupFields(
  pickup: NonNullable<ReturnType<typeof getPickupConfig>>,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    [pickup.targetField]: record[pickup.mapField],
  };
  pickup.fillFields?.forEach((f) => {
    fields[f.from] = resolveDisplayValue(f, record);
  });
  if (pickup.embeddedField) {
    fields[pickup.embeddedField] = record;
  }
  return fields;
}

export function formatFillFieldValue(
  fillField: { type?: string },
  value: unknown,
  t: (key: string) => string,
): string {
  if (fillField.type === "switch") return value ? t("yes") : t("no");
  return String(value ?? "");
}
