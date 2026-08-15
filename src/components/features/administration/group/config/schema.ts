import { z } from "zod";

export const groupSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().default(""),
});

export type GroupFormValues = z.infer<typeof groupSchema>;
