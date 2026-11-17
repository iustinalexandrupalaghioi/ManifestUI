import type { ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRightIcon } from "lucide-react";
import { z } from "zod";
import { AddItem, defineSection, EditNote, EditOnly, list, List, media, MediaEdit, RemoveItem, Text, text } from "@/framework/site";
import { Link } from "@/i18n/navigation";
import { MobileNav, type NavItem } from "@/components/site/MobileNav";
import { AccountMenu } from "@/components/site/session/AccountMenu";
import { isExternalHref, SiteLink, toSiteHref } from "@/components/site/SiteLink";
import { cn } from "@/lib/utils";
import { L } from "@/extensions/sections/fields";
import { linkField } from "@/extensions/site/fields";

/** In the editor, a link with its address editable underneath (and an optional × next to it); on the site, just the link. */
export function withNote(edit: boolean, link: ReactNode, hrefPath: string, remove?: ReactNode) {
  if (!edit) return link;
  return (
    <span className="flex flex-col gap-1">
      <span className="flex items-center gap-1">
        {link}
        {remove}
      </span>
      <EditNote path={hrefPath} label={L("Link", "Legătură")} />
    </span>
  );
}

const linkClass =
  "rounded-md px-1 py-2.5 text-[15px] font-medium whitespace-nowrap text-foreground/85 no-underline hover:text-foreground";

/** The site's name, or its logo when one is uploaded. */
function Brand({ logo, name, edit }: { logo: { src: string; width: number; height: number }; name: string; edit: boolean }) {
  return (
    <span className="relative flex items-center gap-2">
      {logo.src ? (
        <Image src={logo.src} alt={name} width={logo.width || 160} height={logo.height || 40} className="h-8 w-auto" priority />
      ) : (
        <Text path="brand" as="span" className="font-display text-lg font-semibold tracking-tight text-foreground" />
      )}
      {edit && <MediaEdit path="logo" label={L(logo.src ? "Replace logo" : "Add logo", logo.src ? "Înlocuiește sigla" : "Adaugă o siglă")} removable={!!logo.src} className="static" />}
    </span>
  );
}

/**
 * The sticky site header, edited in Website › Site settings: the site's name
 * or logo, links, the account menu and a call to action. Below `lg`: a
 * compact call to action and the full-screen menu. Interface labels (Log in,
 * Menu, Language…) stay in the message files.
 */
export const siteHeader = defineSection({
  type: "siteHeader",
  label: L("Header", "Antet"),
  schema: z.object({
    brand: text({ label: L("Site name", "Numele site-ului"), required: true }),
    logo: media({ label: L("Logo (optional; replaces the name)", "Siglă (opțional; înlocuiește numele)"), accept: "image" }),
    links: list(linkField(), { label: L("Links", "Legături"), itemLabel: L("Link", "Legătură") }),
    cta: linkField(L("Call to action", "Îndemn")),
    ctaShort: text({ label: L("Call to action, short (phones)", "Îndemn, scurt (telefoane)") }),
  }),
  component: function SiteHeaderView({ content: c, edit }) {
    const t = useTranslations("Auth");
    const tSite = useTranslations("Site");
    const tNav = useTranslations("Landing.nav");
    const items: NavItem[] = c.links.map((link) =>
      isExternalHref(link.href) ? { label: link.label, href: link.href, external: true } : { label: link.label, href: toSiteHref(link.href) },
    );
    const brand = <Brand logo={c.logo} name={c.brand} edit={edit} />;

    return (
      // `data-site-header` marks the live header, so the settings editor can hide it behind the editable copy.
      <header data-site-header={edit ? undefined : ""} className="sticky top-0 z-50 w-full border-b bg-background/90 backdrop-blur-md supports-backdrop-filter:bg-background/80">
        <div className={cn("mx-auto flex h-16 w-full max-w-300 items-center justify-between gap-3 px-4 sm:px-6", edit && "h-auto min-h-16 py-2")}>
          <div className="flex min-w-0 items-center gap-8">
            <Link href="/" aria-label={tNav("home")} className="flex min-h-11 min-w-11 shrink-0 items-center rounded-md no-underline">
              {brand}
            </Link>
            <nav aria-label={tNav("main")} className={cn("hidden items-center gap-6 lg:flex", edit && "flex-wrap items-start")}>
              <List path="links" items={c.links}>
                {(link) =>
                  withNote(
                    edit,
                    <SiteLink href={link.href} className={linkClass}>
                      <Text path="label" />
                    </SiteLink>,
                    "href",
                    <RemoveItem label={L("Remove link", "Elimină legătura")} />,
                  )
                }
              </List>
              <AddItem path="links" label={L("Add link", "Adaugă o legătură")} />
            </nav>
          </div>

          {/* Desktop actions */}
          <div className="hidden shrink-0 items-center gap-2 lg:flex">
            <AccountMenu loginLabel={t("login")} linkClassName={linkClass} />
            {withNote(
              edit,
              <SiteLink
                href={c.cta.href}
                className="ml-1 inline-flex min-h-11 items-center gap-1.5 rounded-[10px] bg-primary px-4 text-[15px] font-semibold text-primary-foreground no-underline hover:bg-primary/90"
              >
                <Text path="cta.label" />
                <ArrowRightIcon aria-hidden className="size-4" />
              </SiteLink>,
              "cta.href",
            )}
          </div>

          {/* Mobile actions */}
          <div className="flex shrink-0 items-center gap-1.5 lg:hidden">
            <SiteLink
              href={c.cta.href}
              className="flex min-h-11 items-center rounded-[10px] bg-primary px-3.5 text-sm font-semibold text-primary-foreground no-underline"
            >
              <Text path="ctaShort" />
            </SiteLink>
            <MobileNav
              brand={c.logo.src ? brand : <span className="font-display text-lg font-semibold">{c.brand}</span>}
              items={items}
              studioHref={c.cta.href}
              accounts={{ signedIn: { label: tSite("profile"), href: "/profile" }, signedOut: { label: t("login"), href: "/auth/login" } }}
              labels={{
                menu: tNav("menu"),
                close: tNav("closeMenu"),
                home: tNav("home"),
                language: tNav("language"),
                theme: tSite("theme"),
                themes: { light: tNav("themeLight"), dark: tNav("themeDark"), system: tNav("themeSystem") },
                openStudio: c.cta.label,
                openStudioShort: c.ctaShort,
              }}
            />
          </div>
        </div>
        <EditOnly>
          <p className="mx-auto w-full max-w-300 px-4 pb-2 text-xs text-muted-foreground sm:px-6">
            {/* Shown in the editor only: where the name is used when a logo is set. */}
            The site name is also the logo&apos;s description for screen readers.
          </p>
        </EditOnly>
      </header>
    );
  },
});
