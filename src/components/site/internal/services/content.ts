import "server-only";

import { getEntry, listEntries } from "@/framework/content/server/content.server";

export interface ServiceSummary {
  entryId: string;
  slug: string;
  title: string;
  summary: string;
  image: { src: string; width: number; height: number };
}

export interface Service extends ServiceSummary {
  /** Row id, for the editors' "Edit this service" link. */
  id: number;
  body: string;
  /** The locale actually served: English when the translation is missing. */
  locale: string;
}

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * The published services in order ("service" entries, read through the content
 * layer: cached, refreshed on publish, the draft in draft mode). Each one is in
 * `locale` when translated, else in English.
 */
export async function getServices(locale: string): Promise<ServiceSummary[]> {
  const { items } = await listEntries("service", {
    locale,
    fallbackLocale: "en",
    order: [{ field: "position" }, { field: "slug" }],
    draft: true,
  });
  return items.map(({ entryId, data }) => ({ entryId, slug: data.slug, title: data.title, summary: data.summary, image: data.image }));
}

/** One published service, in `locale` when translated, else in English. */
export async function getService(locale: string, slug: string): Promise<Service | null> {
  if (!SLUG.test(slug)) return null;
  const entry = await getEntry("service", { locale, slug, fallbackLocale: "en", draft: true });
  if (!entry) return null;
  const { data } = entry;
  return {
    id: Number(entry.rowId),
    entryId: entry.entryId,
    slug: data.slug,
    title: data.title,
    summary: data.summary,
    image: data.image,
    body: data.body,
    locale: entry.locale,
  };
}
