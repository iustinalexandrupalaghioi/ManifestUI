import type { DetailSlots } from "@/framework/types/define-resource-type";
import type { Todo } from "@/components/features/main/todo/config/api";
import { todoAttachmentsPanel } from "./attachmentsPanel";

export const todosDetailSlots: DetailSlots<Todo> = {
  afterForm: todoAttachmentsPanel.with({ height: 300 }),
};
