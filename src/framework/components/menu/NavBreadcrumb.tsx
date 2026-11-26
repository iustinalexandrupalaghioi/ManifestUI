"use client";

import { Fragment } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { useRecordTitle } from "@/framework/components/page/recordTitle";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { sectionLinks, type MenuSection } from "./types";

interface Crumb {
  label: string;
  href?: string;
}

/**
 * Where the page is: `Module / Screen` on a list, `Module / Screen / Record` on a
 * record (its title comes from the record page), with the menu group after the module when
 * the screen is in one (`Content / Blog / Blog posts`). On phones only the last
 * part is shown, as the page title. `resources` names the screens that aren't in the menu.
 */
export function NavBreadcrumb({
  sections,
  resources,
  folderHref,
  home,
}: {
  sections: MenuSection[];
  resources: readonly ResourceDescriptor[];
  /** A folder section's page: its module crumb links there (Content › back to the folder). */
  folderHref?: (folder: string) => string;
  /** The CMS home: with `?folder=…` it shows a folder, named in the breadcrumb. */
  home?: string;
}) {
  const t = useTranslations("Menu");
  const pathname = usePathname();
  const folderParam = useSearchParams().get("folder");
  const recordTitle = useRecordTitle();
  const locale = useLocale();

  // The page this path belongs to: the longest matching menu link, else a resource that
  // isn't in the menu (opened from a relation, popped out of a list), by its list route.
  const inside = (path: string) => pathname === path || pathname.startsWith(`${path}/`);
  let match: { module?: string; moduleHref?: string; group?: string; name: string; path: string } | undefined;
  for (const section of sections) {
    for (const { link, group } of sectionLinks(section)) {
      if (inside(link.path) && (!match || link.path.length > match.path.length)) {
        const moduleHref = section.folder && folderHref ? folderHref(section.folder) : undefined;
        match = { module: section.module, moduleHref, group, name: link.name, path: link.path };
      }
    }
  }
  if (!match) {
    for (const descriptor of resources) {
      const path = descriptor.routes.list;
      if (inside(path) && (!match || path.length > match.path.length)) {
        match = { name: resolveLabel(descriptor.plural, locale), path };
      }
    }
  }
  // A folder opened in the home (/cms?folder=content): just its name, like a screen's.
  const openFolder =
    home && pathname === home && folderParam ? sections.find((section) => section.folder === folderParam) : undefined;

  let crumbs: Crumb[];
  if (openFolder) {
    crumbs = [{ label: openFolder.module }];
  } else {
    if (!match) return null;
    const rest = pathname.slice(match.path.length).replace(/^\/+/, "");
    // Content / Blog / Blog posts: the module, then the menu group when the link is in one.
    const where: Crumb[] = [
      ...(match.module ? [{ label: match.module, href: match.moduleHref }] : []),
      ...(match.group ? [{ label: match.group }] : []),
    ];
    crumbs = !rest
      ? [...where, { label: match.name }]
      : [
          // The module stays on a record too: Administration / Groups / Restricted access.
          ...where,
          { label: match.name, href: match.path },
          { label: rest === "add" ? t("newRecord") : (recordTitle ?? "…") },
        ];
  }

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
