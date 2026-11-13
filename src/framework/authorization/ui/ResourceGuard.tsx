import type { ReactNode } from "react";
import { redirect } from "@/i18n/navigation";
import { getLocale } from "next-intl/server";
import { getCurrentUserId } from "../lib/getCurrentUserId";
import { hasServerPermission } from "../lib/permissions";
import { AccessDeniedDialog } from "./AccessDeniedDialog";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import { resourceDescriptors } from "@/app/[locale]/cms/resourceDescriptors";

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
  const locale = await getLocale();

  // Not signed in at all — send to login rather than showing "access
  // denied", which is reserved for a signed-in user missing the permission.
  if (!userId) {
    redirect({ href: "/auth/login", locale });
  }

  const allowed = await hasServerPermission(userId, `${resourceId}:${action}`);

  if (!allowed) {
    // Resolve the descriptor's translated plural label, not the raw
    // resourceId (e.g. "group-permissions") — the same "raw identifier leaks
    // into translated sentence" bug class as DeleteDialog's old `noun` prop.
    const descriptor = resourceDescriptors.find((d) => d.id === resourceId);
    const resourceLabel = descriptor
      ? resolveLabel(descriptor.plural, locale)
      : undefined;
    return <AccessDeniedDialog resource={resourceLabel} />;
  }

  return children;
}
