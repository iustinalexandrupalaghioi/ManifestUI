import "server-only";

import { getEntry } from "@/framework/content/server/content.server";
import type { StoredBlock } from "@/framework/content/blocks";

export interface SitePageContent {
  /** Row id, for the editors' "Edit this page" link. */
  id: number;
  /** The entry (the same in every locale), for the live preview. */
  entryId: string;
  locale: string;
  title: string;
  description: string;
  kind: "text" | "sections";
  /** Markdown, for text pages. */
  body: string;
  /** Blocks, for blocks pages: visible and known ones only, references resolved. */
  sections: StoredBlock[];
  updatedAt: string;
}

/** The home page is the blocks page with this address, served at /<locale>. */
export const HOME_SLUG = "home";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * A public site page: the published "page" entry with this address in
 * `locale`, read through the content layer (cached and refreshed on publish;
 * the draft in draft mode). Null when there's no such page.
 */
export async function getSitePage(locale: string, slug: string): Promise<SitePageContent | null> {
  if (!SLUG.test(slug)) return null;
  const entry = await getEntry("page", { locale, slug, draft: true });
  if (!entry) return null;
  return {
    id: Number(entry.rowId),
    entryId: entry.entryId,
    locale: entry.locale,
    title: entry.data.title,
    description: entry.data.description,
    kind: entry.data.kind === "sections" ? "sections" : "text",
    body: entry.data.body,
    sections: entry.data.sections as StoredBlock[],
    updatedAt: entry.publishedAt ?? new Date(0).toISOString(),
  };
}
