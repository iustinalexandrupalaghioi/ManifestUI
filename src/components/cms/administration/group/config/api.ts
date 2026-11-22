"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { group } from "@/db/schema";
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
import { groupSchema, type GroupFormValues } from "./schema";

export type Group = typeof group.$inferSelect;

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  id: group.id,
  name: group.name,
  description: group.description,
  createdAt: group.createdAt,
};
const crud = createResourceActions("groups");

export const {
  fetchGroupList, fetchGroupDetail, addGroup, updateGroup, deleteGroup,
  fetchGroupAggregates,
} = defineResourceActions("groups", {
  fetchGroupList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: group.id,
      });

      const [items, [{ count }]] = await Promise.all([
        db.select().from(group)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(group).where(where),
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
  fetchGroupAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(group).where(where);
      return row;
    },
  ],

  fetchGroupDetail: [
    "read",
    async (id: number) => {
      const [row] = await db.select().from(group)
        .where(eq(group.id, id))
        .limit(1);
      if (!row) throw new Error(`Group ${id} not found`);
      return row;
    },
  ],
  addGroup: crud.add(async (tx, data: GroupFormValues) => {
    const parsed = groupSchema.parse(data);
    const [row] = await tx.insert(group).values(parsed).returning({ id: group.id });
    return row.id;
  }),
  updateGroup: crud.update(async (tx, id: number, data: GroupFormValues) => {
    const parsed = groupSchema.parse(data);
    await tx.update(group).set(parsed).where(eq(group.id, id));
  }),
  deleteGroup: crud.delete((tx, id: number) =>
    tx.delete(group).where(eq(group.id, id))),
});
