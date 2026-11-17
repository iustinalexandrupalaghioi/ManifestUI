import { userGroupsResource } from "@/components/cms/administration/user-group/resource";
import { groupPermissionsResource } from "@/components/cms/administration/group-permission/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type { group } from "@/db/schema";

export const groupsRelations: RelationConfig<typeof group.$inferSelect>[] = [
  {
    key: "users",
    childResource: userGroupsResource,
    filter: (group) => [
      { columnName: "groupId", operator: "equals", value: group.id },
    ],
  },
  {
    key: "permissions",
    childResource: groupPermissionsResource,
    filter: (group) => [
      { columnName: "groupId", operator: "equals", value: group.id },
    ],
  },
];
