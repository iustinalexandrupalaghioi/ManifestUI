import { todosResource } from "@/components/features/main/todo/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type { Relation } from "@/components/features/main/relation/config/api";

export const relationsRelations: RelationConfig<Relation>[] = [
  {
    key: "todos",
    childResource: todosResource,
    filter: (relation) => [
      {
        columnName: "user_id",
        operator: "equals",
        value: relation.id,
      },
    ],
  },
];
