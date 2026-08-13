import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { getCurrentUserId } from "../lib/getCurrentUserId";
import { hasServerPermission } from "../lib/permissions";
import { AccessDeniedDialog } from "./AccessDeniedDialog";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { resourceDescriptors } from "@/app/resourceDescriptors";

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
    const locale = await getLocale();
    // Resolve the descriptor's translated plural label, not the raw
    // resourceId (e.g. "role-permissions") — the same "raw identifier leaks
    // into translated sentence" bug class as DeleteDialog's old `noun` prop.
    const descriptor = resourceDescriptors.find((d) => d.id === resourceId);
    const resourceLabel = descriptor
      ? resolveLabel(descriptor.plural, locale)
      : undefined;
    return <AccessDeniedDialog resource={resourceLabel} />;
  }

  return children;
}
