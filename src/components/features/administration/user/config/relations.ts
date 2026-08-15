import type { User } from "@/app/types/administration/User";
import { userGroupsResource } from "@/components/features/administration/user-group/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";

export const usersRelations: RelationConfig<User>[] = [
  {
    key: "groups",
    childResource: userGroupsResource,
    filter: (user) => [
      { columnName: "user_id", operator: "equals", value: user.id },
    ],
  },
];
