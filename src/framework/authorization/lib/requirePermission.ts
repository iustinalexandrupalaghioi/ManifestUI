import "server-only";
import { getCurrentUserId } from "./getCurrentUserId";
import { hasServerPermission } from "./permissions";
import { ForbiddenError } from "./ForbiddenError";

export async function requirePermission(
  resourceId: string,
  action: string | string[],
): Promise<string> {
  const actions = Array.isArray(action) ? action : [action];
  const permissions = actions.map((a) => `${resourceId}:${a}`);
  const userId = await getCurrentUserId();
  if (!userId) throw new ForbiddenError(permissions.join(" or "));

  const allowed = await hasServerPermission(userId, permissions);
  if (!allowed) throw new ForbiddenError(permissions.join(" or "));

  return userId;
}
