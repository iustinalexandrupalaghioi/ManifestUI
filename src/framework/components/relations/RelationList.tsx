"use client";

import type { KeyboardEvent } from "react";
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

/**
 * A related list sits inside the record's <form> (in a record tab or a layout `list`
 * node). Enter in one of its inputs (search, a filter value, an inline edit) must not
 * submit — and so save — the record: its own handlers have run by the time the key
 * reaches here, so only the browser's implicit submit is cancelled.
 */
function keepEnterInList(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "Enter") return;
  const target = event.target as HTMLElement;
  if (target instanceof HTMLInputElement) event.preventDefault();
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
    // `contents`: no box of its own, so the list lays out as before.
    <div className="contents" onKeyDown={keepEnterInList}>
      <Overview
        preFilters={preFilters}
        slotId={
          slotId ??
          `${relation.key}-${getItemId(item as Record<string, unknown>, idField)}`
        }
        height={height}
        popOutUrl={popOutUrl}
      />
    </div>
  );
}
