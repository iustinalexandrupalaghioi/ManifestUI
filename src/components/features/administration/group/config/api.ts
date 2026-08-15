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
import type { Cursor } from "@/framework/types/pagination";
import type { Group } from "@/app/types/administration/Group";
import { groupSchema, type GroupFormValues } from "./schema";

const PAGE_SIZE = 50;

const filterColumns: FilterColumnMap = {
  id: group.id,
  name: group.name,
  description: group.description,
  created_at: group.created_at,
};

const selection = {
  id: group.id,
  name: group.name,
  description: group.description,
  created_at: group.created_at,
};

const crud = createResourceActions("groups");

export const { fetchGroupList, fetchGroupDetail, addGroup, updateGroup, deleteGroups } =
  defineResourceActions("groups", {
    fetchGroupList: [
      "read",
      async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null) => {
        const where = buildWhereConditions(filters, filterColumns);
        const sortColumns = resolveSortColumns(sorting, filterColumns, {
          key: "id",
          column: group.id,
        });
        const orderBy = buildOrderBy(sortColumns);
        const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));

        const [items, [{ count }]] = await Promise.all([
          db
            .select(selection)
            .from(group)
            .where(seekWhere)
            .orderBy(...orderBy)
            .limit(PAGE_SIZE),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(group)
            .where(where),
        ]);

        const nextCursor =
          items.length === PAGE_SIZE
            ? extractCursor(items[items.length - 1], sortColumns)
            : null;

        return { items: items as Group[], total: count ?? 0, nextCursor };
      },
    ],

    fetchGroupDetail: [
      "read",
      async (id: number): Promise<Group> => {
        const [row] = await db
          .select(selection)
          .from(group)
          .where(eq(group.id, id))
          .limit(1);
        if (!row) throw new Error(`Group ${id} not found`);
        return row as Group;
      },
    ],

    addGroup: crud.add(async (tx, data: GroupFormValues) => {
      const parsed = groupSchema.parse(data);
      const [result] = await tx.insert(group).values(parsed).returning({ id: group.id });
      return result.id;
    }),

    updateGroup: crud.update(async (tx, id: number, data: GroupFormValues) => {
      const parsed = groupSchema.parse(data);
      await tx.update(group).set(parsed).where(eq(group.id, id));
    }),

    deleteGroups: crud.delete((tx, id: number) =>
      tx.delete(group).where(eq(group.id, id)),
    ),
  });
