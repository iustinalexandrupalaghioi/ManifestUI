import { ResourceType } from "./Resource";

export interface RolePermission {
  id: number;
  role_id: number;
  resource_id: number;
  can_read: boolean;
  can_add: boolean;
  can_update: boolean;
  can_delete: boolean;
  allowed: boolean;
  role?: { id: number; name: string };
  resource?: { id: number; name: string; type: ResourceType };
}
