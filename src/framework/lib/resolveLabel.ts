import type { TranslatableText } from "@/framework/types/i18n-types";
import type { Enum } from "@/framework/types/global/Enum";

// Plain function (not a hook) so it's callable both from component render
// (with `useLocale()`'s result) and from server-only, non-component call
// sites (with `getLocale()`'s result — see describeActionFailure.ts).
export function resolveLabel(
  value: TranslatableText,
  locale: string,
  fallbackLocale: string = "en",
): string {
  if (typeof value === "string") return value;
  return (
    value[locale] ??
    value[fallbackLocale] ??
    Object.values(value).find((v): v is string => !!v) ??
    ""
  );
}

// Static `<select>`/`<combobox>` option lists (ColumnConfig.selectOptions,
// SelectFieldConfig/ComboboxFieldConfig.options, DisplayField.options) are
// authored once at module load, before any locale is known. Allowing them to
// be a `(locale) => Enum[]` function instead of a plain array lets producers
// like `createEnum()`/`grantableResourceOptions()` resolve `{ en, ro }`
// labels lazily, at the point where each render boundary already has
// `locale` in scope (createColumnsFromConfig, renderFieldInput, etc).
export type EnumOptions = Enum[] | ((locale: string) => Enum[]);

export function resolveOptions(
  options: EnumOptions | undefined,
  locale: string,
): Enum[] | undefined {
  if (!options) return options;
  return typeof options === "function" ? options(locale) : options;
}
