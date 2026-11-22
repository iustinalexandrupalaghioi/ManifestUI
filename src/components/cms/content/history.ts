import type { RelationConfig } from "@/framework/types/relation-config-type";
import { contentRevisionsResource } from "./content-revision/resource";

/**
 * A content type's History tab: its published versions (the content-revisions
 * resource, filtered to this record), as a normal relation list.
 *
 *   detail: { tabs: [..., contentHistoryTab], relations: [contentHistoryRelation("page")] }
 */
export function contentHistoryRelation<TItem extends { id: number }>(type: string): RelationConfig<TItem> {
  return {
    key: "content-history",
    childResource: contentRevisionsResource as unknown as RelationConfig<TItem>["childResource"],
    filter: (item) => [
      { columnName: "type", operator: "equals", value: type },
      { columnName: "rowId", operator: "equals", value: String(item.id) },
    ],
    // Publishing writes a version: reloading the record refreshes the list.
    invalidateOn: ["update"],
  };
}

export const contentHistoryTab = {
  type: "relation" as const,
  value: "history",
  label: { en: "History", ro: "Istoric" },
  relationKey: "content-history",
};
