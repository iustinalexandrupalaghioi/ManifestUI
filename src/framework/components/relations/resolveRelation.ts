import type { RelationConfig } from "@/framework/types/relation-config-type";

export function resolveRelation<TParent>(
  relation: RelationConfig<TParent, any, any>,
  item: TParent,
) {
  return {
    preFilters: relation.filter(item),
    popOutUrl: relation.popOutUrl ?? relation.childResource.hooks.routes.list,
    Overview: relation.childResource.components.Overview,
  };
}
