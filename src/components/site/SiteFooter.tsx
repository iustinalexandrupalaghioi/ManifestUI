import { useLocale, useTranslations } from "next-intl";
import type { z } from "zod";
import type { footerBlock } from "@/content/blocks/navigation";
import { LanguageToggle } from "@/components/site/LanguageToggle";
import { ThemeToggle } from "@/components/site/ThemeToggle";
import { cmsHref, SiteLink } from "@/components/site/SiteLink";

export type SiteFooterContent = z.output<typeof footerBlock.fields>;

const linkClass =
  "inline-flex min-h-11 items-center rounded-sm text-[15px] text-muted-foreground no-underline hover:text-foreground sm:min-h-0 sm:py-1";
const heading = "m-0 text-[13px] font-semibold tracking-[0.06em] uppercase";

/**
 * The site-wide footer, from the navigation single entry (Content › Navigation):
 * name and tagline, link columns and the copyright line, then the language and
 * theme controls (interface labels stay in the message files).
 */
export function SiteFooter({ content: c }: { content: SiteFooterContent }) {
  const t = useTranslations("Landing.footer");
  const tNav = useTranslations("Landing.nav");
  const tSite = useTranslations("Site");
  const locale = useLocale();
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto grid w-full max-w-300 gap-10 px-4 py-14 sm:px-6 md:grid-cols-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))_auto]">
        <div className="flex max-w-[320px] flex-col gap-3">
          {c.brand && <p className="m-0 font-display text-lg font-semibold tracking-tight">{c.brand}</p>}
          {c.tagline && <p className="m-0 text-sm leading-relaxed whitespace-pre-line text-muted-foreground">{c.tagline}</p>}
        </div>
        {c.columns.map((column, i) => (
          <nav key={i} aria-labelledby={`footer-column-${i}`} className="flex flex-col gap-1 sm:gap-2">
            <h2 id={`footer-column-${i}`} className={heading}>
              {column.title}
            </h2>
            {column.links.map((link, j) => (
              <SiteLink key={j} href={cmsHref(link.href, locale)} className={linkClass}>
                {link.label}
              </SiteLink>
            ))}
          </nav>
        ))}
        <div className="flex flex-col gap-3">
          <span aria-hidden className={heading}>
            {t("preferences")}
          </span>
          <LanguageToggle label={tNav("language")} size="lg" className="self-start" />
          <ThemeToggle
            label={tSite("theme")}
            names={{ light: tNav("themeLight"), dark: tNav("themeDark"), system: tNav("themeSystem") }}
            className="self-start"
          />
        </div>
      </div>
      <div className="mx-auto w-full max-w-300 border-t px-4 py-6 text-[13px] text-muted-foreground sm:px-6">
        {c.copyright.replaceAll("{year}", String(new Date().getFullYear()))}
      </div>
    </footer>
  );
}
