import "server-only";

import { eq } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import en from "@/db/seed/site-settings/en.json";
import ro from "@/db/seed/site-settings/ro.json";
import { cachedRead, SITE_TAGS } from "../cache";
import { parseSiteSettings, type SiteSettingsContent } from "./model";

const STARTER: Record<string, unknown> = { en, ro };

/**
 * The header and footer for `locale`, from Website > Site settings. Cached
 * until the settings are saved (see ../cache.ts). Until a record exists (or
 * when the database can't be read) the site uses the starter content that
 * `pnpm db:seed:content` writes, so it never renders without a header.
 */
export async function getSiteSettings(locale: string): Promise<SiteSettingsContent> {
  try {
    return await cachedRead(["site-settings", locale], [SITE_TAGS.settings(locale)], async () => {
      const [row] = await db.select({ content: siteSettings.content }).from(siteSettings).where(eq(siteSettings.locale, locale)).limit(1);
      return parseSiteSettings(row?.content ?? STARTER[locale] ?? STARTER.en);
    });
  } catch (error) {
    // Not cached, so the next request tries the database again. CI builds have no database at all.
    if (process.env.NEXT_PHASE === "phase-production-build") console.warn(`[site-settings] database unavailable during the build; ${locale} uses the starter header and footer`);
    else console.error("[site-settings] falling back to the starter content:", error);
    return parseSiteSettings(STARTER[locale] ?? STARTER.en);
  }
}
