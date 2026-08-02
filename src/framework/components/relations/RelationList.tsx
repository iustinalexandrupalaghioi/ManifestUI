import type { RelationConfig } from "@/framework/types/relation-config-type";
import { getItemId } from "@/framework/core/resource-id";
import { resolveRelation } from "./resolveRelation";

interface RelationListProps<TParent> {
  relation: RelationConfig<TParent, any, any>;
  item: TParent;
  idField?: string;
  slotId?: string;
  height?: number;
}

export function RelationList<TParent>({
  relation,
  item,
  idField = "id",
  slotId,
  height,
}: RelationListProps<TParent>) {
  const { preFilters, popOutUrl, Overview } = resolveRelation(relation, item);

  return (
    <Overview
      preFilters={preFilters}
      slotId={
        slotId ??
        `${relation.key}-${getItemId(item as Record<string, unknown>, idField)}`
      }
      height={height}
      popOutUrl={popOutUrl}
    />
  );
}
