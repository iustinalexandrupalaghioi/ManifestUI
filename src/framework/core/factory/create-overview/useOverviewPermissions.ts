import { usePermissions } from "@/framework/authorization/hooks/usePermissions";
import { resolvePermission } from "@/framework/lib/resolvePermissions";
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
  const { isSuccess: permissionsLoaded } = usePermissions();
  const canRead = resolvePermission(permissions?.read);
  const canAdd = resolvePermission(permissions?.add) && enabled.addToolbar;
  const canDeletePermission = resolvePermission(permissions?.delete);
  const canUpdate = resolvePermission(permissions?.update);
  return {
    permissionsLoaded,
    canRead,
    canAdd,
    canDelete: canDeletePermission && enabled.deleteRow,
    canDeleteToolbar: canDeletePermission && enabled.deleteToolbar,
    gridEditable: canUpdate && enabled.editing,
  };
}
