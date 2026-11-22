import { getLocale } from "next-intl/server";
import { SiteHeader } from "./SiteHeader";
import { getSiteSettings } from "./internal/settings/content";

/**
 * Sticky site header: the navigation single entry's header for the current
 * locale. The same for every visitor (pages are static); the account parts
 * come from the browser session.
 */
export async function SiteHeaderSlot() {
  const settings = await getSiteSettings(await getLocale());
  return <SiteHeader content={settings.header} />;
}
