import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";

/** A link stored as text in the CMS: "/learn", "/#pricing" or an absolute URL. */
export type SiteHref = string | { pathname: string; hash: string };

export const isExternalHref = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);

/** "/#pricing" → { pathname: "/", hash: "pricing" } for the locale-aware Link; other paths stay strings. */
export function toSiteHref(href: string): SiteHref {
  const [pathname, hash] = href.split("#");
  return hash ? { pathname: pathname || "/", hash } : href || "/";
}

/** Renders a CMS link: a plain anchor for external URLs, the locale-aware Link for site paths. */
export function SiteLink({ href, className, children }: { href: string; className?: string; children: ReactNode }) {
  if (isExternalHref(href))
    return (
      <a href={href} className={className}>
        {children}
      </a>
    );
  return (
    <Link href={toSiteHref(href)} className={className}>
      {children}
    </Link>
  );
}
