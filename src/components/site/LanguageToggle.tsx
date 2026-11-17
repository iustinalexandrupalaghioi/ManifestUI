"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Each locale's name in its own language, for screen readers. */
const LOCALE_NAMES: Record<string, string> = { en: "English", ro: "Română" };

/**
 * A visible EN / RO switch: one link per locale, the current one marked.
 * `size="lg"` gives 44px tap targets (mobile menu, footer).
 */
export function LanguageToggle({
  label,
  className,
  size = "sm",
}: {
  label: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <nav
      aria-label={label}
      className={cn("flex items-center border", size === "lg" ? "rounded-[10px] p-[3px]" : "rounded-md p-0.5", className)}
    >
      {routing.locales.map((code) => {
        const current = code === locale;
        return (
          <Link
            key={code}
            href={pathname}
            locale={code}
            lang={code}
            hrefLang={code}
            aria-current={current ? "true" : undefined}
            aria-label={LOCALE_NAMES[code] ?? code}
            className={cn(
              "flex items-center justify-center font-semibold uppercase no-underline",
              size === "lg"
                ? "min-h-11 min-w-13 rounded-[7px] px-3 text-sm"
                : "h-7 min-w-8 rounded-[5px] px-1.5 text-xs",
              current ? "bg-surface-2 text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {code}
          </Link>
        );
      })}
    </nav>
  );
}
