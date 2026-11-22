"use server";

import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db";
import { groupPermission, group } from "@/db/schema";
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
import { groupPermissionSchema, type GroupPermissionFormValues } from "./schema";
import { groupPermissionServerHooks } from "./hooks";

export type GroupPermission = typeof groupPermission.$inferSelect & { [value: string]: unknown } & { group: Pick<typeof group.$inferSelect, "id" | "name"> | null };

/** Each row: its columns and the related records' values. */
const selection = {
  ...getTableColumns(groupPermission),
  group: { id: group.id, name: group.name },
  // Values the server rules add (config/hooks.ts).
  ...groupPermissionServerHooks.select,
};

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  id: groupPermission.id,
  groupId: groupPermission.groupId,
  resourceId: groupPermission.resourceId,
  canRead: groupPermission.canRead,
  canAdd: groupPermission.canAdd,
  canUpdate: groupPermission.canUpdate,
  canDelete: groupPermission.canDelete,
  allowed: groupPermission.allowed,
  "group.name": group.name,
};
const crud = createResourceActions("group-permissions");

export const {
  fetchGroupPermissionList, fetchGroupPermissionDetail, addGroupPermission, updateGroupPermission, deleteGroupPermission,
  fetchGroupPermissionAggregates,
} = defineResourceActions("group-permissions", {
  fetchGroupPermissionList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await groupPermissionServerHooks.scope?.());
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: groupPermission.id,
      });

      const [items, [{ count }]] = await Promise.all([
        db.select(selection).from(groupPermission)
          .leftJoin(group, eq(groupPermission.groupId, group.id))
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(groupPermission)
          .leftJoin(group, eq(groupPermission.groupId, group.id)).where(where),
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
  fetchGroupPermissionAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await groupPermissionServerHooks.scope?.());
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(groupPermission)
          .leftJoin(group, eq(groupPermission.groupId, group.id)).where(where);
      return row;
    },
  ],

  fetchGroupPermissionDetail: [
    "read",
    async (id: number) => {
      const [row] = await db.select(selection).from(groupPermission)
          .leftJoin(group, eq(groupPermission.groupId, group.id))
        .where(and(eq(groupPermission.id, id), await groupPermissionServerHooks.scope?.()))
        .limit(1);
      if (!row) throw new Error(`Group permission ${id} not found`);
      return row;
    },
  ],
  addGroupPermission: crud.add(async (tx, data: GroupPermissionFormValues) => {
    const parsed = groupPermissionSchema.parse(data);
    const extra = await groupPermissionServerHooks.beforeAdd?.(parsed, tx);
    const [row] = await tx.insert(groupPermission).values({ ...parsed, ...extra }).returning({ id: groupPermission.id });
    return row.id;
  }),
  updateGroupPermission: crud.update(async (tx, id: number, data: GroupPermissionFormValues) => {
    const parsed = groupPermissionSchema.parse(data);
    const extra = await groupPermissionServerHooks.beforeUpdate?.(id, parsed, tx);
    await tx.update(groupPermission).set({ ...parsed, ...extra }).where(eq(groupPermission.id, id));
  }),
  deleteGroupPermission: crud.delete(async (tx, id: number) => {
    await groupPermissionServerHooks.beforeDelete?.(id, tx);
    return tx.delete(groupPermission).where(eq(groupPermission.id, id));
  }),
});
