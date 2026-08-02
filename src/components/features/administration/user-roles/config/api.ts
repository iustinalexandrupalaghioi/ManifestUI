"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { user_roles, roles, users } from "@/db/schema";
import {
  assertHasAllPermissions,
  defineResourceActions,
  getCurrentUserId,
  getPermissionsForRoleIds,
} from "@/framework/authorization/rbac";
import { createResourceActions } from "@/framework/lib/transactionalAction";
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "@/framework/components/data-view/features/filtering/filters";
import { buildWhereConditions } from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { FilterColumnMap } from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { Cursor } from "@/framework/types/pagination";
import type { UserRole } from "@/app/types/administration/UserRole";
import { userRoleSchema, type UserRoleFormValues } from "./schema";

// Small reference table (users x roles) — pagination/keyset cursoring is
// intentionally skipped, a single page always covers it.
const PAGE_SIZE = 200;

const filterColumns: FilterColumnMap = {
  user_id: user_roles.user_id,
  role_id: user_roles.role_id,
  created_at: user_roles.created_at,
};

const selection = {
  // uuid contains only hyphens, never underscores — safe to split on "_"
  id: sql<string>`${user_roles.user_id} || '_' || ${user_roles.role_id}`,
  user_id: user_roles.user_id,
  role_id: user_roles.role_id,
  created_at: user_roles.created_at,
  role: { id: roles.id, name: roles.name },
  user: { id: users.id, email: users.email, full_name: users.full_name },
};

function parseId(id: string) {
  const idx = id.lastIndexOf("_");
  return { userId: id.slice(0, idx), roleId: Number(id.slice(idx + 1)) };
}

// Holding "user-roles:add" alone must not let a caller assign a role more
// privileged than their own — otherwise it's a confused-deputy escalation:
// a role scoped to "manage teammates' roles" could hand out an
// administrator-equivalent role to anyone, including the caller.
async function assertCanGrantRole(roleId: number): Promise<void> {
  const callerId = await getCurrentUserId();
  if (!callerId) throw new Error("Not authenticated");
  const grantedPermissions = await getPermissionsForRoleIds([roleId]);
  await assertHasAllPermissions(callerId, grantedPermissions, "user-roles:add");
}

const crud = createResourceActions("user-roles");

export const {
  fetchUserRoleList,
  fetchUserRoleDetail,
  addUserRole,
  updateUserRole,
  deleteUserRoles,
} = defineResourceActions("user-roles", {
  fetchUserRoleList: [
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
          .from(user_roles)
          .innerJoin(roles, eq(user_roles.role_id, roles.id))
          .leftJoin(users, eq(user_roles.user_id, users.id))
          .where(where)
          .orderBy(user_roles.created_at)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(user_roles)
          .where(where),
      ]);

      return { items: items as UserRole[], total: count ?? 0, nextCursor: null };
    },
  ],

  fetchUserRoleDetail: [
    "read",
    async (id: string): Promise<UserRole> => {
      const { userId, roleId } = parseId(id);
      const [row] = await db
        .select(selection)
        .from(user_roles)
        .innerJoin(roles, eq(user_roles.role_id, roles.id))
        .leftJoin(users, eq(user_roles.user_id, users.id))
        .where(
          and(eq(user_roles.user_id, userId), eq(user_roles.role_id, roleId)),
        )
        .limit(1);
      if (!row) throw new Error(`UserRole ${id} not found`);
      return row as UserRole;
    },
  ],

  addUserRole: crud.add(
    async (tx, data: UserRoleFormValues) => {
      const parsed = userRoleSchema.parse(data);
      await assertCanGrantRole(parsed.role_id);
      await tx.insert(user_roles).values(parsed);
      return `${parsed.user_id}_${parsed.role_id}`;
    },
    (data: UserRoleFormValues) => `${data.user_id}_${data.role_id}`,
  ),

  updateUserRole: crud.update(async (tx, id: string, data: UserRoleFormValues) => {
    const parsed = userRoleSchema.parse(data);
    await assertCanGrantRole(parsed.role_id);
    const { userId, roleId } = parseId(id);
    await tx
      .update(user_roles)
      .set(parsed)
      .where(and(eq(user_roles.user_id, userId), eq(user_roles.role_id, roleId)));
  }),

  deleteUserRoles: crud.delete((tx, id: string) => {
    const { userId, roleId } = parseId(id);
    return tx
      .delete(user_roles)
      .where(and(eq(user_roles.user_id, userId), eq(user_roles.role_id, roleId)));
  }),
});
