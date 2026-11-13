import { z } from "zod";

export const userGroupSchema = z.object({
  user_id: z.uuid("Must be a valid Supabase user id (UUID)").trim(),
  group_id: z.coerce.number().min(1, "Group is required"),
});

export type UserGroupFormValues = z.infer<typeof userGroupSchema>;
