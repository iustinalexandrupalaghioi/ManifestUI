import { userRolesResource } from "@/components/features/administration/user-roles/resource";
import { rolePermissionsResource } from "@/components/features/administration/role-permissions/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type { Role } from "@/app/types/administration/Role";

export const rolesRelations: RelationConfig<Role>[] = [
  {
    key: "users",
    childResource: userRolesResource,
    filter: (role) => [
      { columnName: "role_id", operator: "equals", value: role.id },
    ],
  },
  {
    key: "permissions",
    childResource: rolePermissionsResource,
    filter: (role) => [
      { columnName: "role_id", operator: "equals", value: role.id },
    ],
  },
];
