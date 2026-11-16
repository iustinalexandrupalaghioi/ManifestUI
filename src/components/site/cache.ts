import "server-only";

import { unstable_cache, updateTag } from "next/cache";

/**
 * Cache for the public site's content. Reads are cached per page or lesson
 * and tagged; CMS saves expire exactly the tags they touch (after the
 * transaction commits), so the next visitor gets the new version. Anything
 * changed outside the CMS (seeding, SQL) shows up within `SAFETY_NET` seconds.
 *
 * The site still renders per request (its layout reads the signed-in user),
 * but no longer queries the database for content on every request.
 */
const SAFETY_NET = 60 * 60;

export const SITE_TAGS = {
  /** Every site page. */
  pages: "site-pages",
  page: (slug: string, locale: string) => `site-page:${slug}:${locale}`,
  /** Every lesson read (lists and single lessons). */
  lessons: "learn-lessons",
  lessonList: "learn-lessons:list",
  /** One lesson in every locale (a missing translation falls back to English). */
  lesson: (slug: string) => `learn-lesson:${slug}`,
  /** The header and footer of one locale. */
  settings: (locale: string) => `site-settings:${locale}`,
  /** A collection's items (every locale). */
  collection: (name: string) => `collection:${name}`,
} as const;

/** Caches `load` under `key`, tagged with `tags`. */
export function cachedRead<T>(key: string[], tags: string[], load: () => Promise<T>): Promise<T> {
  return unstable_cache(load, key, { tags, revalidate: SAFETY_NET })();
}

/** After saving site pages: refreshes these pages (old and new addresses), or every page when none are given. */
export function refreshSitePages(pages?: { slug: string; locale: string }[]) {
  if (!pages) return updateTag(SITE_TAGS.pages);
  for (const { slug, locale } of pages) updateTag(SITE_TAGS.page(slug, locale));
}

/** After saving a collection's records (add, edit, delete): refreshes every page that shows the collection. */
export function refreshCollection(name: string) {
  updateTag(SITE_TAGS.collection(name));
}

/** After saving site settings: refreshes every page's header and footer in these locales. */
export function refreshSiteSettings(locales: string[]) {
  for (const locale of new Set(locales)) updateTag(SITE_TAGS.settings(locale));
}

/** After saving lessons: refreshes the lesson list and these lessons, or every lesson when none are given. */
export function refreshLessons(slugs?: string[]) {
  updateTag(SITE_TAGS.lessonList);
  if (!slugs) return updateTag(SITE_TAGS.lessons);
  for (const slug of new Set(slugs)) updateTag(SITE_TAGS.lesson(slug));
}
