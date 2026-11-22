import "server-only";

import { getSingleton } from "@/framework/content/server/content.server";
import en from "@/db/seed/site-settings/en.json";
import ro from "@/db/seed/site-settings/ro.json";
import { parseSiteSettings, type SiteSettingsContent } from "./model";

const STARTER: Record<string, unknown> = { en, ro };

/**
 * The header and footer for `locale`: the "navigation" single entry, read
 * through the content layer (cached, refreshed on publish; the draft in
 * draft mode). Until it's published in a locale the content layer serves its
 * defaults, the starter content; when the database can't be read, so does
 * this, so the site never renders without a header.
 */
export async function getSiteSettings(locale: string): Promise<SiteSettingsContent> {
  try {
    const entry = await getSingleton("navigation", { locale, draft: true });
    return parseSiteSettings(entry?.data ?? STARTER[locale] ?? STARTER.en);
  } catch (error) {
    console.error("[site-settings] falling back to the starter content:", error);
    return parseSiteSettings(STARTER[locale] ?? STARTER.en);
  }
}
