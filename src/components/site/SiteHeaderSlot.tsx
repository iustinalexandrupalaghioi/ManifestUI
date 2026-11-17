import { getLocale } from "next-intl/server";
import { RenderSection } from "@/framework/site";
import { siteHeader } from "@/extensions/site/SiteHeader";
import { getSiteSettings } from "./internal/settings/content";

/**
 * Sticky site header: the header from Website > Site settings for the
 * current locale (layout in src/extensions/site/SiteHeader.tsx). The same for
 * every visitor (pages are static); the account parts come from the browser
 * session.
 */
export async function SiteHeaderSlot() {
  const settings = await getSiteSettings(await getLocale());
  return <RenderSection def={siteHeader} id="site-header" content={settings.header} edit={false} />;
}
