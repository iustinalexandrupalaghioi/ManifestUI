import { z } from "zod";

export const userGroupSchema = z.object({
  userId: z.uuid().trim().min(1, "User is required"),
  groupId: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.coerce.number().int().min(1)),
});

export type UserGroupFormValues = z.infer<typeof userGroupSchema>;
