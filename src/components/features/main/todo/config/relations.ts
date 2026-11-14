import { attachmentsResource } from "@/components/features/main/todo-attachment/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type { Todo } from "@/components/features/main/todo/config/api";

export const todosRelations: RelationConfig<Todo>[] = [
  {
    key: "attachments",
    childResource: attachmentsResource,
    filter: (todo) => [
      {
        columnName: "id",
        operator: "equals",
        value: todo.id,
        origin: "todos",
      },
    ],
  },
];
