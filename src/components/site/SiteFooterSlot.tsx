import { getLocale } from "next-intl/server";
import { SiteFooter } from "./SiteFooter";
import { getSiteSettings } from "./internal/settings/content";

/** Site-wide footer: the navigation single entry's footer for the current locale. */
export async function SiteFooterSlot() {
  const settings = await getSiteSettings(await getLocale());
  return <SiteFooter content={settings.footer} />;
}
