export interface RolePermission {
  id: number;
  role_id: number;
  // A code-level id (see src/app/grantablePermissions.ts), not a DB foreign
  // key — e.g. "todos" or "todos:complete-with-note".
  resource_id: string;
  can_read: boolean;
  can_add: boolean;
  can_update: boolean;
  can_delete: boolean;
  allowed: boolean;
  role?: { id: number; name: string };
}
