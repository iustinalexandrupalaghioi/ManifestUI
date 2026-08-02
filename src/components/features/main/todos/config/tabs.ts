import type { TabConfig } from "@/framework/types/tab-config-type";
import type { Todo } from "@/app/types/main/Todo";
import type { TodoFormValues } from "./schema";

export const todosTabs: TabConfig<Todo, TodoFormValues>[] = [
  {
    type: "relation",
    value: "attachments",
    label: "Attachments",
    relationKey: "attachments",
  },
];
