"use server";

import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentRevision } from "@/db/schema";
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
import { contentRevisionSchema, type ContentRevisionFormValues } from "./schema";
import { contentRevisionServerHooks } from "./hooks";

export type ContentRevision = typeof contentRevision.$inferSelect & { [value: string]: unknown };

/** Each row: its columns. */
const selection = {
  ...getTableColumns(contentRevision),
  // Values the server rules add (config/hooks.ts).
  ...contentRevisionServerHooks.select,
};

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  id: contentRevision.id,
  type: contentRevision.type,
  rowId: contentRevision.rowId,
  data: contentRevision.data,
  publishedAt: contentRevision.publishedAt,
  publishedBy: contentRevision.publishedBy,
};
const crud = createResourceActions("content-revisions");

export const {
  fetchContentRevisionList, fetchContentRevisionDetail, addContentRevision, updateContentRevision, deleteContentRevision,
  fetchContentRevisionAggregates,
} = defineResourceActions("content-revisions", {
  fetchContentRevisionList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await contentRevisionServerHooks.scope?.());
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: contentRevision.id,
      });

      const [items, [{ count }]] = await Promise.all([
        db.select(selection).from(contentRevision)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(contentRevision).where(where),
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
  fetchContentRevisionAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await contentRevisionServerHooks.scope?.());
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(contentRevision).where(where);
      return row;
    },
  ],

  fetchContentRevisionDetail: [
    "read",
    async (id: number) => {
      const [row] = await db.select(selection).from(contentRevision)
        .where(and(eq(contentRevision.id, id), await contentRevisionServerHooks.scope?.()))
        .limit(1);
      if (!row) throw new Error(`Version ${id} not found`);
      return row;
    },
  ],
  addContentRevision: [
    "add",
    async (_data: ContentRevisionFormValues): Promise<number> => {
      throw new Error("Versions aren't added in the CMS.");
    },
  ],
  updateContentRevision: crud.update(async (tx, id: number, data: ContentRevisionFormValues) => {
    const parsed = contentRevisionSchema.parse(data);
    const extra = await contentRevisionServerHooks.beforeUpdate?.(id, parsed, tx);
    await tx.update(contentRevision).set({ ...parsed, ...extra }).where(eq(contentRevision.id, id));
  }),
  deleteContentRevision: [
    "delete",
    async (_ids: number[]): Promise<{ succeededIds: string[]; failures: { id: string; message: string }[] }> => {
      throw new Error("Versions aren't deleted in the CMS.");
    },
  ],
});
