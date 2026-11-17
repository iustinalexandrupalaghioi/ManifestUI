import { z } from "zod";
import { PageLocale } from "../../site-page/config/constants";

const media = z
  .object({ src: z.string(), width: z.number().nonnegative(), height: z.number().nonnegative() })
  .catch({ src: "", width: 0, height: 0 });

export const serviceSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, digits and dashes, e.g. web-design"),
  locale: z.enum(PageLocale.values),
  summary: z.string().trim().default(""),
  body: z.string().default(""),
  image: media,
  // An empty input means "first": normalized before the number check, so it never becomes NaN.
  position: z.preprocess((value) => (value === "" || value == null ? 0 : value), z.number().int().min(0)),
  published: z.boolean().default(false),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;
