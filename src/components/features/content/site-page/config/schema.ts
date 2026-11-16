import { z } from "zod";
import { parseSections, validateSections } from "@/components/site/sections/model";
import { PageKind, PageLocale } from "./constants";

export const sitePageSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, digits and dashes, e.g. privacy-policy"),
  locale: z.enum(PageLocale.values),
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().default(""),
  kind: z.enum(PageKind.values),
  body: z.string().default(""),
  /**
   * Checked against the registered defineSection schemas (src/extensions/sections)
   * in the form and again in the save action, so invalid content is refused on the server.
   */
  sections: z
    .array(z.unknown())
    .superRefine((sections, ctx) => {
      for (const issue of validateSections(sections)) ctx.addIssue({ code: "custom", path: issue.path, message: issue.message });
    })
    // Store the normalized shape (missing fields filled in).
    .transform((sections): unknown[] => parseSections(sections))
    .default([]),
  published: z.boolean().default(false),
});

export type SitePageFormValues = z.infer<typeof sitePageSchema>;
