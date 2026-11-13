"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { userGroup, group, user } from "@/db/schema";
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
import { userGroupSchema, type UserGroupFormValues } from "./schema";

const PAGE_SIZE = 200;

const filterColumns: FilterColumnMap = {
  userId: userGroup.userId,
  groupId: userGroup.groupId,
  createdAt: userGroup.createdAt,
};

const selection = {
  id: sql<string>`${userGroup.userId} || '_' || ${userGroup.groupId}`,
  userId: userGroup.userId,
  groupId: userGroup.groupId,
  createdAt: userGroup.createdAt,
  group: { id: group.id, name: group.name },
  user: { id: user.id, email: user.email, fullName: user.fullName },
};

export type UserGroup = typeof userGroup.$inferSelect & {
  id: string;
  group: Pick<typeof group.$inferSelect, "id" | "name">;
  user:
    | Pick<typeof user.$inferSelect, "id" | "email" | "fullName">
    | null;
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
          .from(userGroup)
          .innerJoin(group, eq(userGroup.groupId, group.id))
          .leftJoin(user, eq(userGroup.userId, user.id))
          .where(where)
          .orderBy(userGroup.createdAt)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(userGroup)
          .where(where),
      ]);

      return {
        items,
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

      const [row] = await db.select(selection).from(userGroup).where(where);
      return row;
    },
  ],

  fetchUserGroupDetail: [
    "read",
    async (id: string): Promise<UserGroup> => {
      const { userId, groupId } = parseId(id);
      const [row] = await db
        .select(selection)
        .from(userGroup)
        .innerJoin(group, eq(userGroup.groupId, group.id))
        .leftJoin(user, eq(userGroup.userId, user.id))
        .where(
          and(eq(userGroup.userId, userId), eq(userGroup.groupId, groupId)),
        )
        .limit(1);
      if (!row) throw new Error(`UserGroup ${id} not found`);
      return row;
    },
  ],

  addUserGroup: crud.add(
    async (tx, data: UserGroupFormValues) => {
      const parsed = userGroupSchema.parse(data);
      await assertCanGrantGroup(parsed.group_id);
      await tx.insert(userGroup).values({
        userId: parsed.user_id,
        groupId: parsed.group_id,
      });
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
        .update(userGroup)
        .set({ userId: parsed.user_id, groupId: parsed.group_id })
        .where(
          and(eq(userGroup.userId, userId), eq(userGroup.groupId, groupId)),
        );
    },
  ),

  deleteUserGroups: crud.delete((tx, id: string) => {
    const { userId, groupId } = parseId(id);
    return tx
      .delete(userGroup)
      .where(
        and(eq(userGroup.userId, userId), eq(userGroup.groupId, groupId)),
      );
  }),
});
