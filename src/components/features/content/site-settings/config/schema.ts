import { z } from "zod";
import { siteSettingsContentSchema } from "@/components/site/settings/model";
import { PageLocale } from "../../site-page/config/constants";

export const siteSettingsSchema = z.object({
  locale: z.enum(PageLocale.values),
  /** Header and footer, checked in the form and again in the save action (src/components/site/settings/model.ts). */
  content: siteSettingsContentSchema,
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;
