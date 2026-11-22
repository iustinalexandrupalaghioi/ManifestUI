"use server";

import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentDraft } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { createResourceActions } from "@/app/[locale]/cms/createResourceActions";
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "@/framework/components/data-view/features/filtering/filters";
import {
  buildKeysetWhere,
  buildOrderBy,
  buildWhereConditions,
  extractCursor,
  resolveSortColumns,
  type FilterColumnMap,
} from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { GroupByRule } from "@/framework/components/data-view/features/grouping/grouping";
import type { AggregateRule } from "@/framework/components/data-view/features/aggregates/aggregates";
import { buildAggregateSelection } from "@/framework/components/data-view/features/filtering/drizzle-filters";

import type { Cursor } from "@/framework/types/pagination";
import { contentDraftSchema, type ContentDraftFormValues } from "./schema";
import { contentDraftServerHooks } from "./hooks";

export type ContentDraft = typeof contentDraft.$inferSelect & { [value: string]: unknown };

/** Each row: its columns. */
const selection = {
  ...getTableColumns(contentDraft),
  // Values the server rules add (config/hooks.ts).
  ...contentDraftServerHooks.select,
};

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  id: contentDraft.id,
  type: contentDraft.type,
  rowId: contentDraft.rowId,
  data: contentDraft.data,
  updatedAt: contentDraft.updatedAt,
  updatedBy: contentDraft.updatedBy,
};
const crud = createResourceActions("content-drafts");

export const {
  fetchContentDraftList, fetchContentDraftDetail, addContentDraft, updateContentDraft, deleteContentDraft,
  fetchContentDraftAggregates,
} = defineResourceActions("content-drafts", {
  fetchContentDraftList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await contentDraftServerHooks.scope?.());
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: contentDraft.id,
      });

      const [items, [{ count }]] = await Promise.all([
        db.select(selection).from(contentDraft)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(contentDraft).where(where),
      ]);
      return {
        items: items,
        total: count ?? 0,
        nextCursor: items.length === PAGE_SIZE
          ? extractCursor(items[items.length - 1], sortColumns)
          : null,
      };
    },
  ],
  fetchContentDraftAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await contentDraftServerHooks.scope?.());
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(contentDraft).where(where);
      return row;
    },
  ],

  fetchContentDraftDetail: [
    "read",
    async (id: number) => {
      const [row] = await db.select(selection).from(contentDraft)
        .where(and(eq(contentDraft.id, id), await contentDraftServerHooks.scope?.()))
        .limit(1);
      if (!row) throw new Error(`Draft ${id} not found`);
      return row;
    },
  ],
  addContentDraft: [
    "add",
    async (_data: ContentDraftFormValues): Promise<number> => {
      throw new Error("Drafts are written by Save draft, not added here.");
    },
  ],
  updateContentDraft: crud.update(async (tx, id: number, data: ContentDraftFormValues) => {
    const parsed = contentDraftSchema.parse(data);
    const extra = await contentDraftServerHooks.beforeUpdate?.(id, parsed, tx);
    await tx.update(contentDraft).set({ ...parsed, ...extra }).where(eq(contentDraft.id, id));
  }),
  deleteContentDraft: [
    "delete",
    async (_ids: number[]): Promise<{ succeededIds: string[]; failures: { id: string; message: string }[] }> => {
      throw new Error("Drafts are removed by Discard draft or Publish.");
    },
  ],
});
