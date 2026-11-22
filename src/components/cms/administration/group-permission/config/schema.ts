import { z } from "zod";

export const groupPermissionSchema = z.object({
  groupId: z.preprocess((value) => (value === "" || value === null ? undefined : value), z.coerce.number().int().min(1)),
  resourceId: z.string().trim().min(1, "Resource is required"),
  canRead: z.boolean().default(false),
  canAdd: z.boolean().default(false),
  canUpdate: z.boolean().default(false),
  canDelete: z.boolean().default(false),
  allowed: z.boolean().default(false),
});

export type GroupPermissionFormValues = z.infer<typeof groupPermissionSchema>;
