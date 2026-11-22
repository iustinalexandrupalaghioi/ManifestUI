import { usePermissions } from "@/framework/authorization/hooks/usePermissions";
import { resolvePermission } from "@/framework/lib/resolvePermissions";
import { useHydrated } from "@/framework/hooks/useHydrated";
import type { ResourcePermissions } from "../../../types/resource-components-types";

/**
 * What the current user may do in an overview: the resource's permissions,
 * narrowed by which actions the resource turns on (toolbar, row, grid edit).
 * Permission values may be hooks, so this runs on every render, in order.
 */
export function useOverviewPermissions(
  permissions: ResourcePermissions | undefined,
  enabled: { addToolbar: boolean; deleteRow: boolean; deleteToolbar: boolean; editing: boolean },
) {
  const { isSuccess } = usePermissions();
  // The server never has the permission cache (it's filled in the browser): until hydration is
  // done, render as the server did (nothing allowed yet), or a section that hydrates after the
  // cache fills would render Add/Delete the server HTML lacks (a hydration mismatch).
  const hydrated = useHydrated();
  const allowed = (value: Parameters<typeof resolvePermission>[0]) => hydrated && resolvePermission(value);
  const permissionsLoaded = hydrated && isSuccess;
  const canRead = allowed(permissions?.read);
  const canAdd = allowed(permissions?.add) && enabled.addToolbar;
  const canDeletePermission = allowed(permissions?.delete);
  const canUpdate = allowed(permissions?.update);
  return {
    permissionsLoaded,
    canRead,
    canAdd,
    canDelete: canDeletePermission && enabled.deleteRow,
    canDeleteToolbar: canDeletePermission && enabled.deleteToolbar,
    gridEditable: canUpdate && enabled.editing,
  };
}
