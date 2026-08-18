"use client";

import { useLocale } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Languages } from "lucide-react";

// Locale display names are hardcoded (not routed through the message
// catalog) since each one is only ever shown in its own language — e.g.
// "Română" doesn't need an English translation, it *is* the label.
const LOCALE_NAMES: Record<string, string> = {
  en: "English",
  ro: "Română",
};

function useLocaleSwitch() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const setLocale = (nextLocale: string) => {
    startTransition(() => {
      router.replace(pathname, { locale: nextLocale });
    });
  };

  return { locale, isPending, setLocale };
}

function LocaleRadioItems({
  locale,
  setLocale,
}: {
  locale: string;
  setLocale: (locale: string) => void;
}) {
  return (
    <DropdownMenuRadioGroup value={locale} onValueChange={setLocale}>
      {routing.locales.map((code) => (
        <DropdownMenuRadioItem key={code} value={code}>
          {LOCALE_NAMES[code] ?? code}
        </DropdownMenuRadioItem>
      ))}
    </DropdownMenuRadioGroup>
  );
}

// Standalone trigger, used in the navbar when there's no UserMenu to nest
// it under (logged-out state).
export function LocaleSwitcher() {
  const { locale, isPending, setLocale } = useLocaleSwitch();

  if (routing.locales.length <= 1) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" disabled={isPending}>
          <Languages size={16} className="text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-content" align="start">
        <LocaleRadioItems locale={locale} setLocale={setLocale} />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Nested submenu, used inside UserMenu's Preferences submenu (logged-in
// state) instead of a standalone trigger in the navbar.
export function LocaleMenuSub({ label }: { label: string }) {
  const { locale, setLocale } = useLocaleSwitch();

  if (routing.locales.length <= 1) return null;

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Languages size={16} className="text-muted-foreground" />
        {label}
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <LocaleRadioItems locale={locale} setLocale={setLocale} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
