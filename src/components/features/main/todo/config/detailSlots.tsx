import type { DetailSlots } from "@/framework/types/define-resource-type";
import { RelationList } from "@/framework/components/relations/RelationList";
import { todosRelations } from "./relations";
import { Todo } from "@/app/types/main/Todo";

const todoAttachments = todosRelations.find((r) => r.key === "attachments")!;

export const todosDetailSlots: DetailSlots<Todo> = {
  afterForm: (todo) => (
    <div className="w-full  lg:shrink-0">
      <RelationList
        relation={todoAttachments}
        item={todo}
        slotId={`attachments-preview-${todo.id}`}
        height={300}
      />
    </div>
  ),
};
