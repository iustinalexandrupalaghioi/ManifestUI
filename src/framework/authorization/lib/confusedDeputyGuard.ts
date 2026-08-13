import "server-only";
import { ForbiddenError } from "./ForbiddenError";
import { ALL_PERMISSIONS } from "../constants";
import { getUserPermissions, expandPermissionRows } from "./permissions";

// Confused-deputy guard for permission-granting endpoints (assigning a role
// to a user, adding/editing a role's resource permissions): a caller may
// only hand out permissions they themselves hold. Without this, a role
// scoped to "can manage user-role assignments" or "can manage role
// permissions" would be root-equivalent, since it could otherwise assign
// any role — including a more privileged one — to any user, or edit any
// role's grants (including its own) without limit.
export async function assertHasAllPermissions(
  userId: string,
  permissions: string[],
  context: string,
): Promise<void> {
  if (permissions.length === 0) return;

  const callerPermissions = new Set(await getUserPermissions(userId));
  if (callerPermissions.has(ALL_PERMISSIONS)) return;

  const missing = permissions.filter((p) => !callerPermissions.has(p));
  if (missing.length > 0) {
    throw new ForbiddenError(`${context} (would grant: ${missing.join(", ")})`);
  }
}

// Given a `role_resource_permissions` row's flags (as about to be
// inserted/updated), reconstructs the permission string(s) it would grant —
// so a write to that table can be checked against `assertHasAllPermissions`
// the same way a role assignment is. No DB lookup needed: `resourceId` is
// already the code-level id being granted against (see
// src/app/grantablePermissions.ts), not a row to resolve.
export function permissionStringsForResourceGrant(
  resourceId: string,
  flags: {
    can_read?: boolean | null;
    can_add?: boolean | null;
    can_update?: boolean | null;
    can_delete?: boolean | null;
    allowed?: boolean | null;
  },
): string[] {
  return expandPermissionRows([
    {
      resource_id: resourceId,
      can_read: flags.can_read ?? false,
      can_add: flags.can_add ?? false,
      can_update: flags.can_update ?? false,
      can_delete: flags.can_delete ?? false,
      allowed: flags.allowed ?? false,
    },
  ]);
}
