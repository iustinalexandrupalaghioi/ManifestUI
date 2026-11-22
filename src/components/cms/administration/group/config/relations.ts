import { groupPermissionsResource } from "@/components/cms/administration/group-permission/resource";
import { userGroupsResource } from "@/components/cms/administration/user-group/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type { Group } from "./api";

export const groupRelations: RelationConfig<Group>[] = [
  {
    key: "permissions",
    childResource: groupPermissionsResource,
    filter: (item) => [
      { columnName: "groupId", operator: "equals", value: item["id"] },
    ],
  },
  {
    key: "users",
    childResource: userGroupsResource,
    filter: (item) => [
      { columnName: "groupId", operator: "equals", value: item["id"] },
    ],
  },
];
