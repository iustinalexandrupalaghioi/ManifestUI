"use server";

import { and, eq, getTableColumns, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
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
import { userSchema, type UserFormValues } from "./schema";
import { userServerHooks } from "./hooks";

export type User = typeof user.$inferSelect & { [value: string]: unknown };

/** Each row: its columns. */
const selection = {
  ...getTableColumns(user),
  // Values the server rules add (config/hooks.ts).
  ...userServerHooks.select,
};

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  avatarUrl: user.avatarUrl,
  avatarPath: user.avatarPath,
  administrator: user.administrator,
  bannedUntil: user.bannedUntil,
  lastSignInAt: user.lastSignInAt,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
};
const crud = createResourceActions("users");

export const {
  fetchUserList, fetchUserDetail, addUser, updateUser, deleteUser,
  fetchUserAggregates,
} = defineResourceActions("users", {
  fetchUserList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await userServerHooks.scope?.());
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: user.id,
      });

      const [items, [{ count }]] = await Promise.all([
        db.select(selection).from(user)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(user).where(where),
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
  fetchUserAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = and(buildWhereConditions(filters, filterColumns), await userServerHooks.scope?.());
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(user).where(where);
      return row;
    },
  ],

  fetchUserDetail: [
    "read",
    async (id: string) => {
      const [row] = await db.select(selection).from(user)
        .where(and(eq(user.id, id), await userServerHooks.scope?.()))
        .limit(1);
      if (!row) throw new Error(`User ${id} not found`);
      return row;
    },
  ],
  addUser: [
    "add",
    async (_data: UserFormValues): Promise<string> => {
      throw new Error("Users aren't added in the CMS.");
    },
  ],
  updateUser: crud.update(async (tx, id: string, data: UserFormValues) => {
    const parsed = userSchema.parse(data);
    const { id: _primaryKey, ...updates } = parsed;
    const extra = await userServerHooks.beforeUpdate?.(id, parsed, tx);
    await tx.update(user).set({ ...updates, ...extra }).where(eq(user.id, id));
  }),
  deleteUser: crud.delete(async (tx, id: string) => {
    await userServerHooks.beforeDelete?.(id, tx);
    return tx.delete(user).where(eq(user.id, id));
  }),
});
