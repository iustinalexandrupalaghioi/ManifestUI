// Sentinel returned in place of a permission list when RBAC is bypassed via
// the administrator flag — means "every permission", independent of what
// rows currently exist in the `permissions` table. Shared by permissions.ts
// (server) and usePermissions.ts (client), so it can't carry a
// "server-only" import guard.
export const ALL_PERMISSIONS = "*";
