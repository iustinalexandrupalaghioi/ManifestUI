"use client";

import type { ReactNode } from "react";
import { ArrowRightIcon, MenuIcon, ShieldIcon, XIcon } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";
import { Link } from "@/i18n/navigation";
import type { Theme } from "@/contexts/ThemeContext";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useSiteSession } from "./internal/session/SiteSession";

export type NavItem = {
  label: string;
  /** In-app links go through the locale-aware Link; external ones are plain anchors. */
  href: string | { pathname: string; hash: string };
  external?: boolean;
};

export type MobileNavLabels = {
  menu: string;
  close: string;
  home: string;
  language: string;
  theme: string;
  themes: Record<Theme, string>;
  openStudio: string;
  openStudioShort: string;
};

const linkRow =
  "flex min-h-14 items-center justify-between border-b px-1 font-display text-[22px] font-semibold text-foreground no-underline";

/**
 * The header below `lg`: a menu button that opens a full-screen sheet with the
 * links, language and theme, and the Studio / account actions pinned to the
 * bottom. Radix Dialog traps focus, closes on Escape, announces itself as a
 * dialog and returns focus to the menu button.
 */
export function MobileNav({
  labels,
  items,
  studioHref,
  accounts,
  brand,
}: {
  labels: MobileNavLabels;
  items: NavItem[];
  studioHref: string;
  /**
   * "Profile" for signed-in users, "Log in" for visitors (picked from the browser session),
   * and the CMS link for signed-in users who may open it.
   */
  accounts: { signedIn: NavItem; signedOut: NavItem; cms?: NavItem };
  /** The logo (or name) shown at the top of the open menu. */
  brand: ReactNode;
}) {
  const session = useSiteSession();
  const account = session ? accounts.signedIn : accounts.signedOut;
  const cms = session?.canAccessCms ? accounts.cms : undefined;
  const arrow = <ArrowRightIcon aria-hidden className="size-4.5 text-muted-foreground" />;
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger
        aria-label={labels.menu}
        className="flex size-11 items-center justify-center rounded-[10px] border bg-card text-foreground"
      >
        <MenuIcon aria-hidden className="size-5.5" />
      </DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          className="fixed inset-0 z-60 flex flex-col overflow-y-auto bg-background text-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0"
          aria-describedby={undefined}
        >
          <DialogPrimitive.Title className="sr-only">{labels.menu}</DialogPrimitive.Title>
          <div className="flex h-16 shrink-0 items-center justify-between gap-2 border-b px-4">
            <DialogPrimitive.Close asChild>
              <Link href="/" aria-label={labels.home} className="flex min-h-11 min-w-11 items-center rounded-md">
                {brand}
              </Link>
            </DialogPrimitive.Close>
            <div className="flex items-center gap-1.5">
              <DialogPrimitive.Close asChild>
                <Link
                  href={studioHref}
                  className="flex min-h-11 items-center rounded-[10px] bg-primary px-3.5 text-sm font-semibold text-primary-foreground no-underline"
                >
                  {labels.openStudioShort}
                </Link>
              </DialogPrimitive.Close>
              <DialogPrimitive.Close
                aria-label={labels.close}
                className="flex size-11 items-center justify-center rounded-[10px] border bg-card"
              >
                <XIcon aria-hidden className="size-5.5" />
              </DialogPrimitive.Close>
            </div>
          </div>

          <nav aria-label={labels.menu} className="flex flex-col px-5 py-4">
            {items.map((item) => (
              <DialogPrimitive.Close asChild key={item.label}>
                {item.external ? (
                  <a href={item.href as string} className={linkRow}>
                    {item.label}
                    {arrow}
                  </a>
                ) : (
                  <Link href={item.href} className={linkRow}>
                    {item.label}
                    {arrow}
                  </Link>
                )}
              </DialogPrimitive.Close>
            ))}
          </nav>

          <div className="flex flex-col gap-4 px-5 py-2">
            <div className="flex items-center justify-between gap-4">
              <span className="text-[15px] text-muted-foreground">{labels.language}</span>
              <LanguageToggle label={labels.language} size="lg" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[15px] text-muted-foreground">{labels.theme}</span>
              <ThemeToggle label={labels.theme} names={labels.themes} />
            </div>
          </div>

          <div className="mt-auto flex flex-col gap-2.5 border-t p-5">
            <DialogPrimitive.Close asChild>
              <Link
                href={studioHref}
                className="flex min-h-13 items-center justify-center gap-2 rounded-xl bg-primary text-base font-semibold text-primary-foreground no-underline"
              >
                {labels.openStudio}
                <ArrowRightIcon aria-hidden className="size-4.5" />
              </Link>
            </DialogPrimitive.Close>
            {cms && (
              <DialogPrimitive.Close asChild>
                <Link
                  href={cms.href}
                  className="flex min-h-12 items-center justify-center gap-2 rounded-xl border text-[15px] font-semibold text-foreground no-underline"
                >
                  <ShieldIcon aria-hidden className="size-4.5 text-muted-foreground" />
                  {cms.label}
                </Link>
              </DialogPrimitive.Close>
            )}
            <DialogPrimitive.Close asChild>
              <Link
                href={account.href}
                className="flex min-h-12 items-center justify-center rounded-xl border text-[15px] font-semibold text-foreground no-underline"
              >
                {account.label}
              </Link>
            </DialogPrimitive.Close>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
