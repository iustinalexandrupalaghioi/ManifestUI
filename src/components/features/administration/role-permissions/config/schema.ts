import { z } from "zod";

export const rolePermissionSchema = z.object({
  role_id: z.coerce.number().min(1, "Role is required"),
  resource_id: z.string().trim().min(1, "Resource is required"),
  can_read: z.boolean().default(false),
  can_add: z.boolean().default(false),
  can_update: z.boolean().default(false),
  can_delete: z.boolean().default(false),
  allowed: z.boolean().default(false),
});

export type RolePermissionFormValues = z.infer<typeof rolePermissionSchema>;
