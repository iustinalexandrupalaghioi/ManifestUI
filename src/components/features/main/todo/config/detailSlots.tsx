import type { DetailSlots } from "@/framework/types/define-resource-type";
import type { Todo } from "@/app/types/main/Todo";
import { todoAttachmentsPanel } from "./attachmentsPanel";

export const todosDetailSlots: DetailSlots<Todo> = {
  afterForm: todoAttachmentsPanel.with({ height: 300 }),
};
