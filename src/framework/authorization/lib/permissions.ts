import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { getDbClient } from "@/framework/lib/dbClient";
import { group_permission, group, user_group } from "@/db/schema";
import { ALL_PERMISSIONS } from "../constants";
import { isAdministrator } from "./isAdministrator";

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

// Raw permission grants for a fixed set of groups, independent of which user
// (if any) actually holds them — used both by `getUserPermissions` (the
// caller's own groups) and by `assertHasAllPermissions` (a group about to be
// granted to someone, or a permission about to be added to a group), so a
// grant can be checked against what its *source* actually holds.
export async function getPermissionsForGroupIds(
  groupIds: number[],
): Promise<string[]> {
  if (groupIds.length === 0) return [];

  const rows = await getDbClient()
    .select({
      resource_id: group_permission.resource_id,
      can_read: group_permission.can_read,
      can_add: group_permission.can_add,
      can_update: group_permission.can_update,
      can_delete: group_permission.can_delete,
      allowed: group_permission.allowed,
    })
    .from(group_permission)
    .where(inArray(group_permission.group_id, groupIds));

  return expandPermissionRows(rows);
}

// Administrators skip group/permission checks entirely — they get every
// permission, including ones with no row in `group_permission` yet
// (e.g. a resource nobody has granted access to), not just what's assigned
// via groups.
export async function getUserPermissions(userId: string): Promise<string[]> {
  if (await isAdministrator(userId)) {
    return [ALL_PERMISSIONS];
  }

  const groupRows = await getDbClient()
    .select({ groupId: user_group.group_id })
    .from(user_group)
    .where(eq(user_group.user_id, userId));

  return getPermissionsForGroupIds(groupRows.map((row) => row.groupId));
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

export async function hasGroup(
  userId: string,
  groupName: string,
): Promise<boolean> {
  if (await isAdministrator(userId)) return true;

  const rows = await getDbClient()
    .select({ id: group.id })
    .from(user_group)
    .innerJoin(group, eq(group.id, user_group.group_id))
    .where(and(eq(user_group.user_id, userId), eq(group.name, groupName)))
    .limit(1);

  return rows.length > 0;
}

// "Can this user open the CMS at all" — administrators always can, and
// anyone with at least one group assigned can too, independent of whether
// that group currently grants any actual permission (a group with zero
// permissions still identifies someone as CMS staff, e.g. mid-onboarding
// before their permissions are configured).
export async function hasAnyGroup(userId: string): Promise<boolean> {
  if (await isAdministrator(userId)) return true;

  const rows = await getDbClient()
    .select({ groupId: user_group.group_id })
    .from(user_group)
    .where(eq(user_group.user_id, userId))
    .limit(1);

  return rows.length > 0;
}
