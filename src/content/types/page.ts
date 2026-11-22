import { z } from "zod";
import { defineContentType, strictSchema } from "@/framework/content";
import { sitePage } from "@/db/schema";
import { sitePagesDescriptor } from "@/components/cms/content/site-page/config/descriptor";
import { pageFields as fields } from "../fields/page";

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

/**
 * Website pages: one entry per address, a row per locale. The page with the
 * address "home" is the home page, at /<locale>.
 */
export const pageType = defineContentType({
  name: "page",
  descriptor: sitePagesDescriptor,
  table: sitePage,
  fields,
  schema: z.object({
    slug: z.string().trim().toLowerCase().regex(SLUG, "Use lowercase letters, digits and dashes, e.g. privacy-policy"),
    title: z.string().trim().min(1, "Title is required"),
    description: z.string().trim().default(""),
    kind: z.enum(["text", "sections"]),
    body: z.string().default(""),
    sections: strictSchema(fields.shape.sections).default([]),
  }),
});
