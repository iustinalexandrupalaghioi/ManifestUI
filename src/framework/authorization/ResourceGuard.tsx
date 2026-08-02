import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getCurrentUserId, hasServerPermission } from "./rbac";
import { AccessDeniedDialog } from "./AccessDeniedDialog";

export async function ResourceGuard({
  resourceId,
  action,
  children,
}: {
  resourceId: string;
  action: string;
  children: ReactNode;
}) {
  const userId = await getCurrentUserId();

  // Not signed in at all — send to login rather than showing "access
  // denied", which is reserved for a signed-in user missing the permission.
  if (!userId) {
    redirect("/auth/login");
  }

  const allowed = await hasServerPermission(userId, `${resourceId}:${action}`);

  if (!allowed) {
    return <AccessDeniedDialog resource={resourceId} />;
  }

  return children;
}
