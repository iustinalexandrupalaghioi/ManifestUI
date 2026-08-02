import { z } from "zod";

export const rolePermissionSchema = z.object({
  role_id: z.coerce.number().min(1, "Role is required"),
  resource_id: z.coerce.number().min(1, "Resource is required"),
  can_read: z.boolean().default(false),
  can_add: z.boolean().default(false),
  can_update: z.boolean().default(false),
  can_delete: z.boolean().default(false),
  allowed: z.boolean().default(false),
  // UI-only — filled from the picked resource's `type` so the form knows
  // whether to show the 4 CRUD switches or the single "Allowed" switch.
  // Stripped before hitting the DB, see config/api.ts.
  resource_type: z.string().optional(),
});

export type RolePermissionFormValues = z.infer<typeof rolePermissionSchema>;
