import { RelationList } from "@/framework/components/relations/RelationList";
import type { DetailSlots } from "@/framework/types/define-resource-type";
import type { Relation } from "@/app/types/main/Relation";
import { relationsRelations } from "./relations";

const completedTodosRelation = relationsRelations.find(
  (r) => r.key === "todos",
)!;

export const relationsDetailSlots: DetailSlots<Relation> = {
  right: (relation) => (
    <div className="w-full lg:w-[50%] lg:shrink-0">
      <RelationList
        relation={completedTodosRelation}
        item={relation}
        slotId={`todos-preview-${relation.id}`}
        height={300}
      />
    </div>
  ),
};
