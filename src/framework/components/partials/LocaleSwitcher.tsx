"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";
import { LOCALES, LOCALE_COOKIE, type Locale } from "@/i18n/locales";

// Locale display names are hardcoded (not routed through the message
// catalog) since each one is only ever shown in its own language — e.g.
// "Română" doesn't need an English translation, it *is* the label.
const LOCALE_NAMES: Record<Locale, string> = {
  en: "English",
  ro: "Română",
};

export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  if (LOCALES.length <= 1) return null;

  const setLocale = (nextLocale: string) => {
    document.cookie = `${LOCALE_COOKIE}=${nextLocale}; path=/; max-age=31536000; samesite=lax`;
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          <Languages size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <DropdownMenuRadioGroup value={locale} onValueChange={setLocale}>
          {LOCALES.map((code) => (
            <DropdownMenuRadioItem key={code} value={code}>
              {LOCALE_NAMES[code] ?? code}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
