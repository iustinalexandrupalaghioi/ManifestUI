import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDbClient } from "@/framework/lib/dbClient";
import { role_resource_permissions, roles, user_roles } from "@/db/schema";
import { ALL_PERMISSIONS } from "../constants";
import { isAdministrator } from "./isAdministrator";

// Global escape hatch — set ENABLE_RBAC=false to grant every permission to
// every signed-in user, bypassing roles/permissions entirely.
function isRbacEnabled(): boolean {
  return process.env.ENABLE_RBAC !== "false";
}

type PermissionRow = {
  resource_id: string;
  can_read: boolean | null;
  can_add: boolean | null;
  can_update: boolean | null;
  can_delete: boolean | null;
  allowed: boolean | null;
};

// `resource_id` is a code-level id (see src/app/grantablePermissions.ts),
// not a DB foreign key — it's either a resourceDescriptors id ("todos"),
// expanded via the CRUD flags into "todos:read"/"todos:add"/etc., or an
// already-full grantableActions permission string ("todos:complete-with-note",
// distinguished by containing ":"), gated by the single `allowed` flag.
//
// Exported (not private to this file) because confusedDeputyGuard.ts's
// `permissionStringsForResourceGrant` needs to reconstruct permission
// strings from the same row shape without duplicating this logic.
export function expandPermissionRows(rows: PermissionRow[]): string[] {
  return rows.flatMap((row) =>
    row.resource_id.includes(":")
      ? row.allowed
        ? [row.resource_id]
        : []
      : (
          [
            row.can_read && `${row.resource_id}:read`,
            row.can_add && `${row.resource_id}:add`,
            row.can_update && `${row.resource_id}:update`,
            row.can_delete && `${row.resource_id}:delete`,
          ] as const
        ).filter((v): v is string => !!v),
  );
}

// Raw permission grants for a fixed set of roles, independent of which user
// (if any) actually holds them — used both by `getUserPermissions` (the
// caller's own roles) and by `assertHasAllPermissions` (a role about to be
// granted to someone, or a permission about to be added to a role), so a
// grant can be checked against what its *source* actually holds.
export async function getPermissionsForRoleIds(
  roleIds: number[],
): Promise<string[]> {
  if (roleIds.length === 0) return [];

  const rows = await getDbClient()
    .select({
      resource_id: role_resource_permissions.resource_id,
      can_read: role_resource_permissions.can_read,
      can_add: role_resource_permissions.can_add,
      can_update: role_resource_permissions.can_update,
      can_delete: role_resource_permissions.can_delete,
      allowed: role_resource_permissions.allowed,
    })
    .from(role_resource_permissions)
    .where(inArray(role_resource_permissions.role_id, roleIds));

  return expandPermissionRows(rows);
}

// Administrators skip role/permission checks entirely — they get every
// permission, including ones with no row in `role_resource_permissions` yet
// (e.g. a resource nobody has granted access to), not just what's assigned
// via roles.
export async function getUserPermissions(userId: string): Promise<string[]> {
  if (!isRbacEnabled() || (await isAdministrator(userId))) {
    return [ALL_PERMISSIONS];
  }

  const roleRows = await getDbClient()
    .select({ roleId: user_roles.role_id })
    .from(user_roles)
    .where(eq(user_roles.user_id, userId));

  return getPermissionsForRoleIds(roleRows.map((row) => row.roleId));
}

export async function hasServerPermission(
  userId: string | null,
  permission: string | string[],
): Promise<boolean> {
  if (!userId) return false;
  const perms = await getUserPermissions(userId);
  if (perms.includes(ALL_PERMISSIONS)) return true;
  const required = Array.isArray(permission) ? permission : [permission];
  return required.some((p) => perms.includes(p));
}

export async function hasRole(
  userId: string,
  roleName: string,
): Promise<boolean> {
  if (!isRbacEnabled() || (await isAdministrator(userId))) return true;

  const rows = await getDbClient()
    .select({ id: roles.id })
    .from(user_roles)
    .innerJoin(roles, eq(roles.id, user_roles.role_id))
    .where(and(eq(user_roles.user_id, userId), eq(roles.name, roleName)))
    .limit(1);

  return rows.length > 0;
}
