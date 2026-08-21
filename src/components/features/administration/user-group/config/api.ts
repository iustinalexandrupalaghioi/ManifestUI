"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { user_group, group, user } from "@/db/schema";
import { assertHasAllPermissions } from "@/framework/authorization/lib/confusedDeputyGuard";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { getPermissionsForGroupIds } from "@/framework/authorization/lib/permissions";
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
import type { UserGroup } from "@/app/types/administration/UserGroup";
import { userGroupSchema, type UserGroupFormValues } from "./schema";

const PAGE_SIZE = 200;

const filterColumns: FilterColumnMap = {
  user_id: user_group.user_id,
  group_id: user_group.group_id,
  created_at: user_group.created_at,
};

const selection = {
  id: sql<string>`${user_group.user_id} || '_' || ${user_group.group_id}`,
  user_id: user_group.user_id,
  group_id: user_group.group_id,
  created_at: user_group.created_at,
  group: { id: group.id, name: group.name },
  user: { id: user.id, email: user.email, full_name: user.full_name },
};

function parseId(id: string) {
  const idx = id.lastIndexOf("_");
  return { userId: id.slice(0, idx), groupId: Number(id.slice(idx + 1)) };
}

async function assertCanGrantGroup(groupId: number): Promise<void> {
  const callerId = await getCurrentUserId();
  if (!callerId) throw new Error("Not authenticated");
  const grantedPermissions = await getPermissionsForGroupIds([groupId]);
  await assertHasAllPermissions(
    callerId,
    grantedPermissions,
    "user-groups:add",
  );
}

const crud = createResourceActions("user-groups");

export const {
  fetchUserGroupList,
  fetchUserGroupAggregates,
  fetchUserGroupDetail,
  addUserGroup,
  updateUserGroup,
  deleteUserGroups,
} = defineResourceActions("user-groups", {
  fetchUserGroupList: [
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
          .from(user_group)
          .innerJoin(group, eq(user_group.group_id, group.id))
          .leftJoin(user, eq(user_group.user_id, user.id))
          .where(where)
          .orderBy(user_group.created_at)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(user_group)
          .where(where),
      ]);

      return {
        items: items as UserGroup[],
        total: count ?? 0,
        nextCursor: null,
      };
    },
  ],

  fetchUserGroupAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const selection = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(selection).length === 0) return {};

      const [row] = await db.select(selection).from(user_group).where(where);
      return row;
    },
  ],

  fetchUserGroupDetail: [
    "read",
    async (id: string): Promise<UserGroup> => {
      const { userId, groupId } = parseId(id);
      const [row] = await db
        .select(selection)
        .from(user_group)
        .innerJoin(group, eq(user_group.group_id, group.id))
        .leftJoin(user, eq(user_group.user_id, user.id))
        .where(
          and(eq(user_group.user_id, userId), eq(user_group.group_id, groupId)),
        )
        .limit(1);
      if (!row) throw new Error(`UserGroup ${id} not found`);
      return row as UserGroup;
    },
  ],

  addUserGroup: crud.add(
    async (tx, data: UserGroupFormValues) => {
      const parsed = userGroupSchema.parse(data);
      await assertCanGrantGroup(parsed.group_id);
      await tx.insert(user_group).values(parsed);
      return `${parsed.user_id}_${parsed.group_id}`;
    },
    (data: UserGroupFormValues) => `${data.user_id}_${data.group_id}`,
  ),

  updateUserGroup: crud.update(
    async (tx, id: string, data: UserGroupFormValues) => {
      const parsed = userGroupSchema.parse(data);
      await assertCanGrantGroup(parsed.group_id);
      const { userId, groupId } = parseId(id);
      await tx
        .update(user_group)
        .set(parsed)
        .where(
          and(eq(user_group.user_id, userId), eq(user_group.group_id, groupId)),
        );
    },
  ),

  deleteUserGroups: crud.delete((tx, id: string) => {
    const { userId, groupId } = parseId(id);
    return tx
      .delete(user_group)
      .where(
        and(eq(user_group.user_id, userId), eq(user_group.group_id, groupId)),
      );
  }),
});
