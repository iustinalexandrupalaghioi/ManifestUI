import type { Metadata } from "next";
import type { ReactNode } from "react";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";

/**
 * The <html> shell each area renders. The site and the CMS are separate root
 * layouts (no src/app/[locale]/layout.tsx), so moving between them is a full
 * page load and each starts with only its own globals.css: client-side
 * navigation would keep the previous area's stylesheet, and its theme tokens
 * and fonts would leak into the other.
 */

/** Defaults each area's metadata starts from. */
export const rootMetadata: Metadata = {
  title: "ManifestUI",
  description: "Full-stack app built with ManifestUI",
};

export const localeParams = () => routing.locales.map((locale) => ({ locale }));

/**
 * Checks the [locale] segment, rendering a 404 for unknown ones. next-intl
 * reads it through `next/root-params` (src/i18n/request.ts), so nothing
 * needs to set it.
 */
export function checkLocale(locale: string) {
  if (!hasLocale(routing.locales, locale)) notFound();
  return locale;
}

export function RootDocument({ locale, children }: { locale: string; children: ReactNode }) {
  return (
    <html lang={locale} suppressHydrationWarning>
      <body>
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
