import type { TranslatableText } from "@/framework/types/i18n-types";

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
