import { z } from "zod";
import { strictSchema } from "@/framework/content";
import { navigationType } from "@/content/types/navigation";

export const siteSettingsSchema = z.object({
  locale: z.enum(["en", "ro"]),
  content: strictSchema(navigationType.fields).optional(),
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;
