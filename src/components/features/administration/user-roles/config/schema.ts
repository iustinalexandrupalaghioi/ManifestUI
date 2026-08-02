import { z } from "zod";

export const userRoleSchema = z.object({
  user_id: z.uuid("Must be a valid Supabase user id (UUID)").trim(),
  role_id: z.coerce.number().min(1, "Role is required"),
});

export type UserRoleFormValues = z.infer<typeof userRoleSchema>;
