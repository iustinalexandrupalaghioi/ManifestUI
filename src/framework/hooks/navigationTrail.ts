"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";

/**
 * The pages visited in this tab (locale-less path + query), newest last. A list's
 * Back uses it to leave the resource instead of stepping back into a record of it
 * (list → record → breadcrumb to the list → Back would otherwise reopen the record).
 */
const MAX_ENTRIES = 50;
const trail: { pathname: string; href: string }[] = [];

/** Mount once in the app shell; records every page change. */
export function NavigationTrail() {
  const pathname = usePathname();
  useEffect(() => {
    const href = pathname + window.location.search;
    const last = trail[trail.length - 1];
    if (last?.pathname === pathname) {
      last.href = href;
      return;
    }
    trail.push({ pathname, href });
    if (trail.length > MAX_ENTRIES) trail.shift();
  }, [pathname]);
  return null;
}

const isInside = (pathname: string, base: string) =>
  pathname === base || pathname.startsWith(`${base}/`);

/**
 * Where Back from the list at `listPath` goes: `"history"` when the previous page is
 * outside the resource (a plain history step keeps its scroll and state), else the
 * last page visited outside it, else the list's parent route.
 */
export function backTargetForList(listPath: string): "history" | string {
  const previous = trail[trail.length - 2];
  if (previous && !isInside(previous.pathname, listPath)) return "history";
  for (let i = trail.length - 2; i >= 0; i--) {
    if (!isInside(trail[i].pathname, listPath)) return trail[i].href;
  }
  return listPath.replace(/\/[^/]+\/?$/, "") || "/";
}
