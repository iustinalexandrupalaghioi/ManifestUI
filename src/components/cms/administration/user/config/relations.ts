import type { user } from "@/db/schema";
import { userGroupsResource } from "@/components/cms/administration/user-group/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";

export const usersRelations: RelationConfig<typeof user.$inferSelect>[] = [
  {
    key: "groups",
    childResource: userGroupsResource,
    filter: (user) => [
      { columnName: "userId", operator: "equals", value: user.id },
    ],
  },
];
