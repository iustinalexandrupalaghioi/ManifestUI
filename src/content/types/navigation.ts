import { defineContentType } from "@/framework/content";
import { siteSettings } from "@/db/schema";
import { siteSettingsDescriptor } from "@/components/cms/content/site-settings/config/descriptor";
import en from "@/db/seed/site-settings/en.json";
import ro from "@/db/seed/site-settings/ro.json";
import { navigationFields } from "../blocks/navigation";

export { footerBlock, headerBlock } from "../blocks/navigation";

/**
 * The header and footer: a single entry with a row per locale, stored in
 * `site_settings.content` as `{ header, footer }` (the shape it always had).
 * New locale rows start from the starter content in src/db/seed/site-settings.
 */
export const navigationType = defineContentType({
  name: "navigation",
  descriptor: siteSettingsDescriptor,
  table: siteSettings,
  jsonColumn: "content",
  fields: navigationFields,
  defaults: { en, ro },
});
