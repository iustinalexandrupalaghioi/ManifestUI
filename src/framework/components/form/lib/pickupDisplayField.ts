import type { TranslatableText } from "@/framework/types/i18n-types";
import type { EnumOptions } from "@/framework/lib/resolveLabel";

export interface DisplayField<TRelated = any> {
  from: string;
  label: TranslatableText;
  span?: number;
  type?:
    | "input"
    | "switch"
    | "combobox"
    | "select"
    | "textarea"
    | "date"
    | "time"
    | "datetime"
    | "json";
  options?: EnumOptions;
  targetField?: string;
  maxRows?: number;
  accessorFn?: (record: TRelated) => unknown;
}

// Resolves a display value from a record, preferring accessorFn (for nested
// or computed values) and falling back to a plain `record[from]` lookup.
export function resolveDisplayValue<TRelated>(
  field: Pick<DisplayField<TRelated>, "from" | "accessorFn">,
  record: TRelated | Record<string, unknown> | null | undefined,
): unknown {
  if (!record) return undefined;
  return field.accessorFn
    ? field.accessorFn(record as TRelated)
    : (record as Record<string, unknown>)[field.from];
}
