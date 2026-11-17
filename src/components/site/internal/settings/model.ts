/**
 * Site settings content ({ header, footer }), stored per locale in
 * `site_settings.content`. Each part is shaped by its defineSection schema in
 * src/components/extensions/site. Client-safe: used by the site, the CMS form and the editor.
 */
import { z } from "zod";
import { strictSchema } from "@/framework/site/sections/fields";
import { siteFooter } from "@/components/extensions/site/SiteFooter";
import { siteHeader } from "@/components/extensions/site/SiteHeader";
import "@/components/extensions/site";

export type SiteSettingsContent = {
  header: z.output<typeof siteHeader.schema>;
  footer: z.output<typeof siteFooter.schema>;
};

/** The editable parts, in canvas order; each renders like a section with this id. */
export const SITE_SETTINGS_PARTS = [
  { id: "header", def: siteHeader },
  { id: "footer", def: siteFooter },
] as const;

/** Reads stored settings leniently: missing or malformed fields become empty. */
export function parseSiteSettings(value: unknown): SiteSettingsContent {
  const raw = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return { header: siteHeader.schema.parse(raw.header ?? {}), footer: siteFooter.schema.parse(raw.footer ?? {}) };
}

/** Save-time check (form and server): no unknown keys or wrong types, text constraints apply; stores the normalized shape. */
export const siteSettingsContentSchema = z
  .strictObject({ header: strictSchema(siteHeader.schema), footer: strictSchema(siteFooter.schema) })
  .transform((value): SiteSettingsContent => parseSiteSettings(value));
