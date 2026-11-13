import type { ResourceId } from "../types/resource-hook-types";

export function getItemId<TId extends ResourceId = ResourceId>(
  item: Record<string, unknown>,
  idField: string,
): TId {
  return item[idField] as TId;
}
