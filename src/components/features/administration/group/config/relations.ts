import { userGroupsResource } from "@/components/features/administration/user-groups/resource";
import { groupPermissionsResource } from "@/components/features/administration/group-permissions/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type { Group } from "@/app/types/administration/Group";

export const groupsRelations: RelationConfig<Group>[] = [
  {
    key: "users",
    childResource: userGroupsResource,
    filter: (group) => [
      { columnName: "group_id", operator: "equals", value: group.id },
    ],
  },
  {
    key: "permissions",
    childResource: groupPermissionsResource,
    filter: (group) => [
      { columnName: "group_id", operator: "equals", value: group.id },
    ],
  },
];
