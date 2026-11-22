import { userGroupsResource } from "@/components/cms/administration/user-group/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type { User } from "./api";

export const userRelations: RelationConfig<User>[] = [
  {
    key: "groups",
    childResource: userGroupsResource,
    filter: (item) => [
      { columnName: "userId", operator: "equals", value: item["id"] },
    ],
  },
];
