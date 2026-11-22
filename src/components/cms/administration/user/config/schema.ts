import { z } from "zod";

export const userSchema = z.object({
  id: z.string(),
  administrator: z.boolean().default(false),
});

export type UserFormValues = z.infer<typeof userSchema>;
