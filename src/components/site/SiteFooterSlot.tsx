import { getLocale } from "next-intl/server";
import { RenderSection } from "@/framework/site";
import { siteFooter } from "@/extensions/site/SiteFooter";
import { getSiteSettings } from "./internal/settings/content";

/**
 * Site-wide footer: the footer from Website > Site settings for the current
 * locale (layout in src/extensions/site/SiteFooter.tsx).
 */
export async function SiteFooterSlot() {
  const settings = await getSiteSettings(await getLocale());
  return <RenderSection def={siteFooter} id="site-footer" content={settings.footer} edit={false} />;
}
