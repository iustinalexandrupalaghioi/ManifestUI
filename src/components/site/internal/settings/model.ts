/**
 * The navigation single entry's content ({ header, footer }), stored per locale
 * in `site_settings.content`, shaped by its blocks (src/content/blocks/navigation.ts).
 * Client-safe: used by the site, the CMS form and the seed script.
 */
import { z } from "zod";
import { strictSchema } from "@/framework/content/fields";
import { footerBlock, headerBlock } from "@/content/blocks/navigation";

export type SiteSettingsContent = {
  header: z.output<typeof headerBlock.fields>;
  footer: z.output<typeof footerBlock.fields>;
};

/** Reads stored settings leniently: missing or malformed fields become empty. */
export function parseSiteSettings(value: unknown): SiteSettingsContent {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return { header: headerBlock.fields.parse(raw.header ?? {}), footer: footerBlock.fields.parse(raw.footer ?? {}) };
}

/** Save-time check (form and server): no unknown keys or wrong types, text constraints apply; stores the normalized shape. */
export const siteSettingsContentSchema = z
  .strictObject({ header: strictSchema(headerBlock.fields), footer: strictSchema(footerBlock.fields) })
  .transform((value): SiteSettingsContent => parseSiteSettings(value));
