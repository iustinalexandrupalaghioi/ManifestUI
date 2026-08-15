import { z } from "zod";

// Only `administrator` is editable — the rest is synced from auth.users via
// the webhook route and shown readonly (see ./form.ts).
export const userSchema = z.object({
  administrator: z.boolean(),
});

export type UserFormValues = z.infer<typeof userSchema>;
