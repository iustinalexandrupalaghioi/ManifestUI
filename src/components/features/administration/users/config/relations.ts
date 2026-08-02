import type { User } from "@/app/types/administration/User";
import { userRolesResource } from "@/components/features/administration/user-roles/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";

export const usersRelations: RelationConfig<User>[] = [
  {
    key: "roles",
    childResource: userRolesResource,
    filter: (user) => [
      { columnName: "user_id", operator: "equals", value: user.id },
    ],
  },
];
