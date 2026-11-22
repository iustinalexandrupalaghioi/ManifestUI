import { z } from "zod";
import { strictSchema } from "@/framework/content";
import { pageType } from "@/content/types/page";

export const sitePageSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, digits and dashes, e.g. privacy-policy"),
  locale: z.enum(["en", "ro"]),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().default(""),
  kind: z.enum(["text", "sections"]).optional(),
  body: z.string().default(""),
  sections: strictSchema(pageType.fields.shape.sections).optional(),
});

export type SitePageFormValues = z.infer<typeof sitePageSchema>;
