import "server-only";
import { assertHasAllPermissions, permissionStringsForResourceGrant } from "@/framework/authorization/lib/confusedDeputyGuard";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { defineServerHooks } from "@/framework/lib/serverHooks";
import type { GroupPermissionFormValues } from "./schema";

/**
 * Nobody can grant a permission they don't hold themselves (the confused-deputy guard):
 * every permission the row would give must already be the caller's.
 */
async function assertCanGrant(data: GroupPermissionFormValues): Promise<void> {
  const callerId = await getCurrentUserId();
  if (!callerId) throw new Error("Not authenticated");
  const granted = permissionStringsForResourceGrant(data.resourceId, {
    can_read: data.canRead,
    can_add: data.canAdd,
    can_update: data.canUpdate,
    can_delete: data.canDelete,
    allowed: data.allowed,
  });
  await assertHasAllPermissions(callerId, granted, "group-permissions:add");
}

/**
 * Group permissions: server rules Studio can't express, called by ./api.ts inside each save.
 * Throw to refuse a change (a ForbiddenError reads as a permission error); return values to
 * add to what's written. Studio created this file and never overwrites it.
 */
export const groupPermissionServerHooks = defineServerHooks<GroupPermissionFormValues, number>({
  async beforeAdd(data) {
    await assertCanGrant(data);
  },
  async beforeUpdate(_id, data) {
    await assertCanGrant(data);
  },
});
