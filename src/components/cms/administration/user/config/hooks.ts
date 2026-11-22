import "server-only";
import { ForbiddenError } from "@/framework/authorization/lib/ForbiddenError";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { isAdministrator } from "@/framework/authorization/lib/isAdministrator";
import { defineServerHooks } from "@/framework/lib/serverHooks";
import type { UserFormValues } from "./schema";

/**
 * Users: server rules Studio can't express, called by ./api.ts inside each save. Throw to
 * refuse a change (a ForbiddenError reads as a permission error); return values to add to what's
 * written. Studio created this file and never overwrites it.
 *
 * Only an administrator changes the administrator flag, and nobody can take it away from
 * themselves (the form locks the switch on your own record too). Users come from sign-up and
 * the auth sync, so the rest of the record isn't edited here.
 */
export const userServerHooks = defineServerHooks<UserFormValues, string>({
  async beforeUpdate(id, data) {
    const callerId = await getCurrentUserId();
    if (!callerId || !(await isAdministrator(callerId))) throw new ForbiddenError("users:grant-admin");
    if (id === callerId && !data.administrator) throw new ForbiddenError("users:grant-admin");
    return { updatedAt: new Date().toISOString() };
  },
});
