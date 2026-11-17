"use server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { user } from "@/db/schema";
import { ForbiddenError } from "@/framework/authorization/lib/ForbiddenError";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { isAdministrator } from "@/framework/authorization/lib/isAdministrator";
import { createResourceActions } from "@/app/[locale]/cms/createResourceActions";
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "@/framework/components/data-view/features/filtering/filters";
import {
  buildAggregateSelection,
  buildWhereConditions,
} from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { FilterColumnMap } from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { AggregateRule } from "@/framework/components/data-view/features/aggregates/aggregates";
import type { GroupByRule } from "@/framework/components/data-view/features/grouping/grouping";
import type { Cursor } from "@/framework/types/pagination";
import { userSchema, type UserFormValues } from "./schema";

const PAGE_SIZE = 100;

const filterColumns: FilterColumnMap = {
  id: user.id,
  fullName: user.fullName,
  email: user.email,
  phone: user.phone,
  administrator: user.administrator,
  createdAt: user.createdAt,
  lastSignInAt: user.lastSignInAt,
};

const selection = {
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
  fetchUserList,
  fetchUserAggregates,
  fetchUserDetail,
  addUser,
  updateUser,
  deleteUsers,
} = defineResourceActions("users", {
  fetchUserList: [
    "read",
    async (
      _sorting: SortRule[],
      filters: FilterRule[],
      _cursor: Cursor | null,
      _groupBy: GroupByRule[],
    ) => {
      const where = buildWhereConditions(filters, filterColumns);

      const [items, [{ count }]] = await Promise.all([
        db
          .select(selection)
          .from(user)
          .where(where)
          .orderBy(user.createdAt)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(user)
          .where(where),
      ]);

      return { items, total: count ?? 0, nextCursor: null };
    },
  ],

  fetchUserAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const selection = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(selection).length === 0) return {};

      const [row] = await db.select(selection).from(user).where(where);
      return row;
    },
  ],

  fetchUserDetail: [
    "read",
    async (id: string): Promise<typeof user.$inferSelect> => {
      const [row] = await db
        .select(selection)
        .from(user)
        .where(eq(user.id, id))
        .limit(1);
      if (!row) throw new Error(`User ${id} not found`);
      return row;
    },
  ],

  addUser: [
    "add",
    async (): Promise<string> => {
      throw new Error("Users are created by signing up, not added manually.");
    },
  ],

  updateUser: crud.update(async (tx, id: string, data: UserFormValues) => {
    const parsed = userSchema.parse(data);
    const callerId = await getCurrentUserId();
    if (!callerId || !(await isAdministrator(callerId))) {
      throw new ForbiddenError("users:grant-admin");
    }

    if (id === callerId && !parsed.administrator) {
      throw new ForbiddenError("users:grant-admin");
    }

    await tx
      .update(user)
      .set({
        administrator: parsed.administrator,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(user.id, id));
  }),

  deleteUsers: crud.delete((tx, id: string) =>
    tx.delete(user).where(eq(user.id, id)),
  ),
});
