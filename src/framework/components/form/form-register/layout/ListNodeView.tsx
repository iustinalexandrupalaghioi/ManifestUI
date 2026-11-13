"use client";

import { RelationList } from "@/framework/components/relations/RelationList";
import { useFormRelations } from "@/framework/components/relations/FormRelationsContext";
import type { ListNode } from "../../types/layout-types";
import { useLayoutRenderContext } from "./LayoutContext";

/** Related-records list inside a form (detail pages only). */
export function ListNodeView({ node }: { node: ListNode }) {
  const ctx = useFormRelations();
  const { item } = useLayoutRenderContext();
  const relation = ctx?.relations.find((r) => r.key === node.relation);

  if (!ctx || !relation || !item) {
    return (
      <div className="rounded-md border border-dashed px-3 py-6 text-center text-sm text-muted-foreground">
        {ctx && !relation
          ? `List "${node.relation}": no such relation on this resource.`
          : "The list appears here once the record is saved."}
      </div>
    );
  }

  return (
    <RelationList
      relation={relation}
      item={item}
      idField={ctx.idField}
      height={node.height}
      slotId={`form-list-${node.relation}-${String(item[ctx.idField] ?? "")}`}
    />
  );
}
