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
import { buildWhereConditions } from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { FilterColumnMap } from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { Cursor } from "@/framework/types/pagination";
import type { User } from "@/app/types/administration/User";
import { userSchema, type UserFormValues } from "./schema";

const PAGE_SIZE = 100;

const filterColumns: FilterColumnMap = {
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  phone: user.phone,
  administrator: user.administrator,
  created_at: user.created_at,
  last_sign_in_at: user.last_sign_in_at,
};

const selection = {
  id: user.id,
  full_name: user.full_name,
  email: user.email,
  phone: user.phone,
  avatar_url: user.avatar_url,
  avatar_path: user.avatar_path,
  administrator: user.administrator,
  banned_until: user.banned_until,
  last_sign_in_at: user.last_sign_in_at,
  created_at: user.created_at,
  updated_at: user.updated_at,
};

const crud = createResourceActions("users");

export const {
  fetchUserList,
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
    ) => {
      const where = buildWhereConditions(filters, filterColumns);

      const [items, [{ count }]] = await Promise.all([
        db
          .select(selection)
          .from(user)
          .where(where)
          .orderBy(user.created_at)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(user)
          .where(where),
      ]);

      return { items: items as User[], total: count ?? 0, nextCursor: null };
    },
  ],

  fetchUserDetail: [
    "read",
    async (id: string): Promise<User> => {
      const [row] = await db
        .select(selection)
        .from(user)
        .where(eq(user.id, id))
        .limit(1);
      if (!row) throw new Error(`User ${id} not found`);
      return row as User;
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
        updated_at: new Date().toISOString(),
      })
      .where(eq(user.id, id));
  }),

  deleteUsers: crud.delete((tx, id: string) =>
    tx.delete(user).where(eq(user.id, id)),
  ),
});
