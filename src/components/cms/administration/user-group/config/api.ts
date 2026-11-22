"use server";

import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db";
import { userGroup, user, group } from "@/db/schema";
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
import { userGroupSchema, type UserGroupFormValues } from "./schema";
import { userGroupServerHooks } from "./hooks";

export type UserGroup = typeof userGroup.$inferSelect & { id: string } & { [value: string]: unknown } & { user: Pick<typeof user.$inferSelect, "id" | "fullName" | "email"> | null } & { group: Pick<typeof group.$inferSelect, "id" | "name"> | null };

/** Each row: its columns, its id (the two keys) and the related records' values. */
const selection = {
  ...getTableColumns(userGroup),
  id: sql<string>`${userGroup.userId} || '_' || ${userGroup.groupId}`,
  user: { id: user.id, fullName: user.fullName, email: user.email },
  group: { id: group.id, name: group.name },
  // Values the server rules add (config/hooks.ts).
  ...userGroupServerHooks.select,
};

/** "<userId>_<groupId>" → the two key values. */
function parseId(id: string) {
  const at = id.lastIndexOf("_");
  return { userId: id.slice(0, at), groupId: Number(id.slice(at + 1)) };
}

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  userId: userGroup.userId,
  groupId: userGroup.groupId,
  createdAt: userGroup.createdAt,
  "user.fullName": user.fullName,
  "user.email": user.email,
  "group.name": group.name,
};
const crud = createResourceActions("user-groups");

export const {
  fetchUserGroupList, fetchUserGroupDetail, addUserGroup, updateUserGroup, deleteUserGroup,
  fetchUserGroupAggregates,
} = defineResourceActions("user-groups", {
  fetchUserGroupList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await userGroupServerHooks.scope?.());
      const sortColumns = resolveSortColumns(sorting, filterColumns, [
        { key: "userId", column: userGroup.userId },
        { key: "groupId", column: userGroup.groupId },
      ]);

      const [items, [{ count }]] = await Promise.all([
        db.select(selection).from(userGroup)
          .leftJoin(user, eq(userGroup.userId, user.id))
          .leftJoin(group, eq(userGroup.groupId, group.id))
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(userGroup)
          .leftJoin(user, eq(userGroup.userId, user.id))
          .leftJoin(group, eq(userGroup.groupId, group.id)).where(where),
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
  fetchUserGroupAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await userGroupServerHooks.scope?.());
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(userGroup)
          .leftJoin(user, eq(userGroup.userId, user.id))
          .leftJoin(group, eq(userGroup.groupId, group.id)).where(where);
      return row;
    },
  ],

  fetchUserGroupDetail: [
    "read",
    async (id: string) => {
      const key = parseId(id);
    const [row] = await db.select(selection).from(userGroup)
          .leftJoin(user, eq(userGroup.userId, user.id))
          .leftJoin(group, eq(userGroup.groupId, group.id))
        .where(and(and(eq(userGroup.userId, key.userId), eq(userGroup.groupId, key.groupId)), await userGroupServerHooks.scope?.()))
        .limit(1);
      if (!row) throw new Error(`User group ${id} not found`);
      return row;
    },
  ],
  addUserGroup: crud.add(async (tx, data: UserGroupFormValues) => {
    const parsed = userGroupSchema.parse(data);
    const extra = await userGroupServerHooks.beforeAdd?.(parsed, tx);
    const [row] = await tx.insert(userGroup).values({ ...parsed, ...extra }).returning({ userId: userGroup.userId, groupId: userGroup.groupId });
    return `${row.userId}_${row.groupId}`;
  }),
  updateUserGroup: crud.update(async (tx, id: string, data: UserGroupFormValues) => {
    const parsed = userGroupSchema.parse(data);
    const extra = await userGroupServerHooks.beforeUpdate?.(id, parsed, tx);
    const key = parseId(id);
    await tx.update(userGroup).set({ ...parsed, ...extra }).where(and(eq(userGroup.userId, key.userId), eq(userGroup.groupId, key.groupId)));
  }),
  deleteUserGroup: crud.delete(async (tx, id: string) => {
    await userGroupServerHooks.beforeDelete?.(id, tx);
    const key = parseId(id);
    return tx.delete(userGroup).where(and(eq(userGroup.userId, key.userId), eq(userGroup.groupId, key.groupId)));
  }),
});
