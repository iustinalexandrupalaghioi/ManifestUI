// Sentinel returned in place of a permission list when RBAC is bypassed
// (administrator flag or ENABLE_RBAC=false) — means "every permission",
// independent of what rows currently exist in the `permissions` table.
// Shared by rbac.ts (server) and usePermissions.ts (client), so it can't
// carry a "server-only" import guard.
export const ALL_PERMISSIONS = "*";
