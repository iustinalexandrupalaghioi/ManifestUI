import { z } from "zod";

export const resourceSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  parent_resource_id: z.coerce.number().optional(),
  type: z.enum(["resource", "action"]).default("resource"),
  label: z.string().trim().min(1, "Label is required"),
  singular_label: z.string().trim().optional(),
  table_name: z.string().trim().optional(),
  description: z.string().trim().default(""),
});

export type ResourceFormValues = z.infer<typeof resourceSchema>;
