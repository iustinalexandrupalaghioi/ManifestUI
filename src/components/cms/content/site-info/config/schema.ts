import { z } from "zod";

export const siteInfoSchema = z.object({
  locale: z.enum(["en", "ro"]),
  siteName: z.string().trim().min(1, "Site name is required"),
  description: z.string().trim().default(""),
});

export type SiteInfoFormValues = z.infer<typeof siteInfoSchema>;
