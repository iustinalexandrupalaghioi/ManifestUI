"use client";

import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useRecordTitle } from "@/framework/components/page/recordTitle";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { resourceDescriptors } from "@/app/[locale]/cms/resourceDescriptors";
import { useMenuItems } from "./MenuItems";

interface Crumb {
  label: string;
  href?: string;
}

/**
 * Where the page is: `Module / Screen` on a list, `Module / Screen / Record` on a
 * record (its title comes from the record page). On phones only the last
 * part is shown, as the page title.
 */
export function NavBreadcrumb() {
  const t = useTranslations("Menu");
  const sections = useMenuItems();
  const pathname = usePathname();
  const recordTitle = useRecordTitle();
  const locale = useLocale();

  // The page this path belongs to: the longest matching menu link, else a resource that
  // isn't in the menu (opened from a relation, popped out of a list), by its list route.
  const inside = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  let match: { module?: string; name: string; path: string } | undefined;
  for (const section of sections) {
    for (const link of section.links) {
      if (inside(link.path) && (!match || link.path.length > match.path.length)) {
        match = { module: section.module, name: link.name, path: link.path };
      }
    }
  }
  if (!match) {
    for (const descriptor of resourceDescriptors) {
      const path = descriptor.routes.list;
      if (inside(path) && (!match || path.length > match.path.length)) {
        match = { name: resolveLabel(descriptor.plural, locale), path };
      }
    }
  }
  if (!match) return null;

  const rest = pathname.slice(match.path.length).replace(/^\/+/, "");
  const crumbs: Crumb[] = !rest
    ? [...(match.module ? [{ label: match.module }] : []), { label: match.name }]
    : [
        // The module stays on a record too: Administration / Groups / Restricted access.
        ...(match.module ? [{ label: match.module }] : []),
        { label: match.name, href: match.path },
        { label: rest === "add" ? t("newRecord") : (recordTitle ?? "…") },
      ];

  return (
    <nav aria-label={t("breadcrumb")} className="min-w-0">
      <ol className="flex min-w-0 items-center gap-1.5 text-sm">
        {crumbs.map((crumb, index) => {
          const last = index === crumbs.length - 1;
          return (
            <Fragment key={index}>
              {index > 0 && (
                <li aria-hidden className="hidden text-muted-foreground sm:block">
                  /
                </li>
              )}
              <li className={last ? "min-w-0 truncate font-medium" : "hidden shrink-0 text-muted-foreground sm:block"}>
                {crumb.href ? (
                  <Link href={crumb.href} className="rounded outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50">
                    {crumb.label}
                  </Link>
                ) : (
                  <span aria-current={last ? "page" : undefined}>{crumb.label}</span>
                )}
              </li>
            </Fragment>
          );
        })}
      </ol>
    </nav>
  );
}
