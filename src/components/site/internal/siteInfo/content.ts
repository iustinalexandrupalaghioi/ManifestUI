import "server-only";

import { getSingleton } from "@/framework/content/server/content.server";
import { siteInfoType } from "@/content/types/siteInfo";

export interface SiteInfo {
  siteName: string;
  description: string;
}

/**
 * The site's name and default description in `locale`: the "siteInfo"
 * single entry (its defaults until published). Falls back to the defaults
 * when the database can't be read, so titles and metadata always render.
 */
export async function getSiteInfo(locale: string): Promise<SiteInfo> {
  const fallback = siteInfoType.fields.parse(siteInfoType.defaults?.[locale] ?? siteInfoType.defaults?.en ?? {});
  try {
    const entry = await getSingleton("siteInfo", { locale });
    return { siteName: entry?.data.siteName || fallback.siteName, description: entry?.data.description || fallback.description };
  } catch (error) {
    console.error("[site-info] falling back to the defaults:", error);
    return fallback;
  }
}
