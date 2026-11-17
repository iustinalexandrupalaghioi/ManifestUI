import "server-only";

import { and, eq } from "drizzle-orm";
import { db } from "@/db";
import { sitePage } from "@/db/schema";
import { parseSections, type Section } from "../sections/model";
import { cachedRead, SITE_TAGS } from "../cache";

export interface SitePageContent {
  /** Row id, for the editors' "Edit this page" link. */
  id: number;
  title: string;
  description: string;
  kind: "text" | "sections";
  /** Markdown, for text pages. */
  body: string;
  /** Sections, for sections pages. */
  sections: Section[];
  updatedAt: string;
}

/** The home page is the sections page with this address, served at /<locale>. */
export const HOME_SLUG = "home";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * A public site page: the published row in `site_page` for this slug and
 * locale, edited in the CMS under Website > Site pages. The database is the
 * only source; `pnpm db:seed:content` adds the starter pages. Cached until
 * the page is saved in the CMS (see ../cache.ts).
 */
export async function getSitePage(locale: string, slug: string): Promise<SitePageContent | null> {
  if (!SLUG.test(slug)) return null;
  try {
    return await cachedRead(["site-page", locale, slug], [SITE_TAGS.pages, SITE_TAGS.page(slug, locale)], () => readSitePage(locale, slug));
  } catch (error) {
    // CI builds have no database: prerender the "not set up yet" page instead of failing.
    // At runtime the error surfaces, so a database blip never caches a missing page.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      console.warn(`[site-pages] database unavailable during the build; /${locale}/${slug} renders as not set up`);
      return null;
    }
    throw error;
  }
}

async function readSitePage(locale: string, slug: string): Promise<SitePageContent | null> {
  const [row] = await db
    .select({
      id: sitePage.id,
      title: sitePage.title,
      description: sitePage.description,
      kind: sitePage.kind,
      body: sitePage.body,
      sections: sitePage.sections,
      updatedAt: sitePage.updatedAt,
    })
    .from(sitePage)
    .where(and(eq(sitePage.slug, slug), eq(sitePage.locale, locale), eq(sitePage.published, true)))
    .limit(1);
  if (!row) return null;
  return {
    ...row,
    kind: row.kind === "sections" ? "sections" : "text",
    sections: parseSections(row.sections),
  };
}
