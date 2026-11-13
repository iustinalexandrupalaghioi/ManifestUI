import type { RelationConfig } from "@/framework/types/relation-config-type";

export function useRelation<TParent>(
  relations: RelationConfig<TParent, any, any>[],
  key: string,
): RelationConfig<TParent, any, any> {
  const relation = relations.find((r) => r.key === key);
  if (!relation) {
    throw new Error(
      `useRelation: no relation with key "${key}" found. Available keys: ${relations
        .map((r) => r.key)
        .join(", ")}`,
    );
  }
  return relation;
}
