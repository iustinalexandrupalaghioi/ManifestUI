import { z } from "zod";

const image = z.object({ src: z.string(), width: z.number(), height: z.number() });

export const serviceSchema = z.object({
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Use lowercase letters, digits and dashes, e.g. web-design"),
  locale: z.enum(["en", "ro"]),
  position: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.coerce.number().int().min(0)).optional(),
  title: z.string().trim().min(1, "Title is required"),
  summary: z.string().trim().default(""),
  image: image.default({ src: "", width: 0, height: 0 }),
  body: z.string().default(""),
});

export type ServiceFormValues = z.infer<typeof serviceSchema>;
