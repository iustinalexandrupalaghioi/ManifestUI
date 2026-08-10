"use server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import {
  ForbiddenError,
  defineResourceActions,
  getCurrentUserId,
  isAdministrator,
} from "@/framework/authorization/rbac";
import { createResourceActions } from "@/app/createResourceActions";
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "@/framework/components/data-view/features/filtering/filters";
import { buildWhereConditions } from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { FilterColumnMap } from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { Cursor } from "@/framework/types/pagination";
import type { User } from "@/app/types/administration/User";
import { userSchema, type UserFormValues } from "./schema";

const PAGE_SIZE = 100;

const filterColumns: FilterColumnMap = {
  id: users.id,
  full_name: users.full_name,
  email: users.email,
  phone: users.phone,
  administrator: users.administrator,
  created_at: users.created_at,
};

const selection = {
  id: users.id,
  full_name: users.full_name,
  email: users.email,
  phone: users.phone,
  administrator: users.administrator,
  banned_until: users.banned_until,
  created_at: users.created_at,
  updated_at: users.updated_at,
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
          .from(users)
          .where(where)
          .orderBy(users.created_at)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(users)
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
        .from(users)
        .where(eq(users.id, id))
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

  // `userSchema` exposes exactly one editable field: `administrator`. That
  // means holding the generic "users:update" permission is equivalent to
  // holding admin-granting power — a role meant for something mundane (e.g.
  // "support: view/unlock users") would become a privilege-escalation
  // vector if `users:update` were ever assigned to it. Require the caller
  // to already be an administrator, independent of the CRUD permission,
  // before this field can be changed at all.
  updateUser: crud.update(async (tx, id: string, data: UserFormValues) => {
    const parsed = userSchema.parse(data);
    const callerId = await getCurrentUserId();
    if (!callerId || !(await isAdministrator(callerId))) {
      throw new ForbiddenError("users:grant-admin");
    }

    // An administrator can grant/revoke admin for anyone else, but never
    // strip their own flag — otherwise the last admin standing could
    // lock themselves (and everyone) out with no one left to grant it
    // back.
    if (id === callerId && !parsed.administrator) {
      throw new ForbiddenError("users:grant-admin");
    }

    await tx
      .update(users)
      .set({
        administrator: parsed.administrator,
        updated_at: new Date().toISOString(),
      })
      .where(eq(users.id, id));
  }),

  deleteUsers: crud.delete((tx, id: string) =>
    tx.delete(users).where(eq(users.id, id)),
  ),
});
