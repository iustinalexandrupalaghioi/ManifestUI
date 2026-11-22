import "server-only";
import { assertHasAllPermissions } from "@/framework/authorization/lib/confusedDeputyGuard";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { getPermissionsForGroupIds } from "@/framework/authorization/lib/permissions";
import { defineServerHooks } from "@/framework/lib/serverHooks";
import type { UserGroupFormValues } from "./schema";

/**
 * Nobody can put a user in a group whose permissions they don't hold themselves (the
 * confused-deputy guard): granting the group would hand out more than the caller has.
 */
async function assertCanGrantGroup(groupId: number): Promise<void> {
  const callerId = await getCurrentUserId();
  if (!callerId) throw new Error("Not authenticated");
  const grantedPermissions = await getPermissionsForGroupIds([groupId]);
  await assertHasAllPermissions(callerId, grantedPermissions, "user-groups:add");
}

/**
 * User groups: server rules Studio can't express, called by ./api.ts inside each save. Throw
 * to refuse a change (a ForbiddenError reads as a permission error); return values to add to
 * what's written. Studio created this file and never overwrites it.
 */
export const userGroupServerHooks = defineServerHooks<UserGroupFormValues, string>({
  async beforeAdd(data) {
    await assertCanGrantGroup(data.groupId);
  },
  async beforeUpdate(_id, data) {
    await assertCanGrantGroup(data.groupId);
  },
});
