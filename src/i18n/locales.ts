// Locale constants shared between server config (request.ts, which needs
// "next/headers" and can't be imported from a Client Component) and client
// code like LocaleSwitcher — kept in their own module with no server-only
// imports so both sides can share one source of truth.
export const LOCALES = ["en", "ro"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "ro";
export const LOCALE_COOKIE = "NEXT_LOCALE";

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (LOCALES as readonly string[]).includes(value);
}
