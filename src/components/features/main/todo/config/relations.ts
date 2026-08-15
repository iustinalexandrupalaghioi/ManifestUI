import { attachmentsResource } from "@/components/features/main/todo-attachments/resource";
import type { RelationConfig } from "@/framework/types/relation-config-type";
import type { Todo } from "@/app/types/main/Todo";

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
