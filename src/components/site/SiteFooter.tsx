import { getLocale } from "next-intl/server";
import { RenderSection } from "@/modules/site";
import { siteFooter } from "@/extensions/site/SiteFooter";
import { getSiteSettings } from "./settings/content";

/**
 * Site-wide footer: the footer from Website > Site settings for the current
 * locale (layout in src/extensions/site/SiteFooter.tsx).
 */
export async function SiteFooter() {
  const settings = await getSiteSettings(await getLocale());
  return <RenderSection def={siteFooter} id="site-footer" content={settings.footer} edit={false} />;
}
