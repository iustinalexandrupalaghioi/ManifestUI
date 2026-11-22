import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRightIcon } from "lucide-react";
import type { z } from "zod";
import type { headerBlock } from "@/content/blocks/navigation";
import { Link } from "@/i18n/navigation";
import { MobileNav, type NavItem } from "@/components/site/MobileNav";
import { AccountMenu } from "@/components/site/session/AccountMenu";
import { cmsHref, isExternalHref, SiteLink, toSiteHref } from "@/components/site/SiteLink";

export type SiteHeaderContent = z.output<typeof headerBlock.fields>;

const linkClass =
  "rounded-md px-1 py-2.5 text-[15px] font-medium whitespace-nowrap text-foreground/85 no-underline hover:text-foreground";

/** The site's name, or its logo when one is uploaded. */
function Brand({ content: c }: { content: SiteHeaderContent }) {
  return c.logo.src ? (
    <Image src={c.logo.src} alt={c.brand} width={c.logo.width || 160} height={c.logo.height || 40} className="h-8 w-auto" priority />
  ) : (
    <span className="font-display text-lg font-semibold tracking-tight text-foreground">{c.brand}</span>
  );
}

/**
 * The sticky site header, from the navigation single entry (Content › Navigation):
 * the site's name or logo, links, then Log in (or the account menu) and the call
 * to action. Below `lg`: a compact call to action and the full-screen menu.
 * Interface labels (Log in, Menu, Language…) stay in the message files.
 */
export function SiteHeader({ content: c }: { content: SiteHeaderContent }) {
  const t = useTranslations("Auth");
  const tSite = useTranslations("Site");
  const tNav = useTranslations("Landing.nav");
  const locale = useLocale();
  // Links are entries or URLs; entry addresses are resolved by the content layer.
  const href = (value: unknown) => cmsHref(value, locale);
  const navItem = (label: string, target: string): NavItem =>
    isExternalHref(target) ? { label, href: target, external: true } : { label, href: toSiteHref(target) };
  const items = c.links.map((link) => navItem(link.label, href(link.href)));
  const cta = c.cta.label && href(c.cta.href) ? href(c.cta.href) : null;

  return (
    <header data-site-header="" className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-16 w-full max-w-300 items-center justify-between gap-3 px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-8">
          <Link href="/" aria-label={tNav("home")} className="flex min-h-11 min-w-11 shrink-0 items-center rounded-md no-underline">
            <Brand content={c} />
          </Link>
          <nav aria-label={tNav("main")} className="hidden items-center gap-6 lg:flex">
            {c.links.map((link, i) => (
              <SiteLink key={i} href={href(link.href)} className={linkClass}>
                {link.label}
              </SiteLink>
            ))}
          </nav>
        </div>

        {/* Desktop actions */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <AccountMenu loginLabel={t("login")} linkClassName={linkClass} />
          {cta && (
            <SiteLink
              href={cta}
              className="ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-primary px-4 text-[15px] font-semibold text-primary-foreground no-underline hover:bg-primary/90"
            >
              {c.cta.label}
              <ArrowRightIcon aria-hidden className="size-4" />
            </SiteLink>
          )}
        </div>

        {/* Mobile actions */}
        <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
          {cta && (
            <SiteLink
              href={cta}
              className="flex min-h-11 items-center rounded-[10px] bg-primary px-3.5 text-sm font-semibold text-primary-foreground no-underline"
            >
              {c.ctaShort || c.cta.label}
            </SiteLink>
          )}
          <MobileNav
            brand={<Brand content={c} />}
            items={items}
            studioHref={cta ?? "/"}
            accounts={{
              signedIn: { label: tSite("profile"), href: "/profile" },
              signedOut: { label: t("login"), href: "/auth/login" },
              cms: { label: tSite("adminPanel"), href: "/cms" },
            }}
            labels={{
              menu: tNav("menu"),
              close: tNav("closeMenu"),
              home: tNav("home"),
              language: tNav("language"),
              theme: tSite("theme"),
              themes: { light: tNav("themeLight"), dark: tNav("themeDark"), system: tNav("themeSystem") },
              openStudio: c.cta.label,
              openStudioShort: c.ctaShort || c.cta.label,
            }}
          />
        </div>
      </div>
    </header>
  );
}
