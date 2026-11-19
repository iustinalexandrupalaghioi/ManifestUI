"use client";

import { Fragment } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { useRecordTitle } from "@/framework/components/page/recordTitle";
import { useMenuItems } from "./MenuItems";

interface Crumb {
  label: string;
  href?: string;
}

/**
 * Where the page is: `Module / Screen` on a list, `Screen / Record` on a
 * record (its title comes from the record page). On phones only the last
 * part is shown, as the page title.
 */
export function NavBreadcrumb() {
  const t = useTranslations("Menu");
  const sections = useMenuItems();
  const pathname = usePathname();
  const recordTitle = useRecordTitle();

  // The menu link this page belongs to: the longest path that prefixes it.
  let match: { module: string; name: string; path: string } | undefined;
  for (const section of sections) {
    for (const link of section.links) {
      const inside = pathname === link.path || pathname.startsWith(`${link.path}/`);
      if (inside && (!match || link.path.length > match.path.length)) {
        match = { module: section.module, name: link.name, path: link.path };
      }
    }
  }
  if (!match) return null;

  const rest = pathname.slice(match.path.length).replace(/^\/+/, "");
  const crumbs: Crumb[] = !rest
    ? [{ label: match.module }, { label: match.name }]
    : [
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
