"use client";

import { LanguagesIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { z } from "zod";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { defineFieldComponent } from "@/framework/extensions";
import { routing } from "@/i18n/routing";

/** The site's languages, named in the CMS's language. */
const NAMES: Record<string, { en: string; ro: string }> = {
  en: { en: "English", ro: "Engleză" },
  ro: { en: "Romanian", ro: "Română" },
};

/**
 * A content entry's language: chosen when the record is added, read-only after (a language
 * row is its own record; the toolbar's language switch moves between them).
 */
export const languageField = defineFieldComponent({
  type: "language",
  label: { en: "Language (fixed after adding)", ro: "Limbă (fixă după adăugare)" },
  icon: LanguagesIcon,
  props: z.object({}),
  component: ({ id, value, onChange, disabled, readOnly, item }) => {
    const locale = useLocale() === "ro" ? "ro" : "en";
    const options = routing.locales.map((code) => ({ value: code, label: NAMES[code]?.[locale] ?? code.toUpperCase() }));
    const current = typeof value === "string" ? value : "";
    // An existing record keeps its language.
    if (item?.id !== undefined && item?.id !== null) {
      return (
        <div id={id} className="flex h-9 items-center rounded-md border bg-muted px-3 text-sm text-muted-foreground">
          {options.find((option) => option.value === current)?.label ?? current}
        </div>
      );
    }
    return (
      <Select value={current} onValueChange={(next) => onChange(next)} disabled={disabled || readOnly}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },
});
