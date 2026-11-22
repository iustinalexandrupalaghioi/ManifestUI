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
// like `createEnum()`/`grantOptions()` resolve `{ en, ro }`
// labels lazily, at the point where each render boundary already has
// `locale` in scope (createColumnsFromConfig, renderFieldInput, etc).
/**
 * An option written once with a label per language, e.g.
 * `{ value: "true", label: { en: "Published", ro: "Publicată" }, tone: "success" }`:
 * a plain literal (what Studio generates and reads back), resolved per locale.
 */
export type EnumOption = Omit<Enum, "label"> & { label: TranslatableText };

export type EnumOptions = EnumOption[] | ((locale: string) => Enum[]);

export function resolveOptions(
  options: EnumOptions | undefined,
  locale: string,
): Enum[] | undefined {
  if (!options) return options;
  if (typeof options === "function") return options(locale);
  return options.map((option) =>
    typeof option.label === "string" ? (option as Enum) : { ...option, label: resolveLabel(option.label, locale) },
  );
}
