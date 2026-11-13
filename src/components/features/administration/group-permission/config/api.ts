"use server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { groupPermission, group } from "@/db/schema";
import {
  assertHasAllPermissions,
  permissionStringsForResourceGrant,
} from "@/framework/authorization/lib/confusedDeputyGuard";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
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
import {
  groupPermissionSchema,
  type GroupPermissionFormValues,
} from "./schema";

const PAGE_SIZE = 200;

const filterColumns: FilterColumnMap = {
  id: groupPermission.id,
  groupId: groupPermission.groupId,
  resourceId: groupPermission.resourceId,
};

const selection = {
  id: groupPermission.id,
  groupId: groupPermission.groupId,
  resourceId: groupPermission.resourceId,
  canRead: groupPermission.canRead,
  canAdd: groupPermission.canAdd,
  canUpdate: groupPermission.canUpdate,
  canDelete: groupPermission.canDelete,
  allowed: groupPermission.allowed,
  group: { id: group.id, name: group.name },
};

export type GroupPermission =
  typeof groupPermission.$inferSelect & {
    group: Pick<typeof group.$inferSelect, "id" | "name">;
  };

async function assertCanGrantResourcePermission(
  data: GroupPermissionFormValues,
): Promise<void> {
  const callerId = await getCurrentUserId();
  if (!callerId) throw new Error("Not authenticated");
  const grantedPermissions = permissionStringsForResourceGrant(data.resource_id, data);
  await assertHasAllPermissions(
    callerId,
    grantedPermissions,
    "group-permissions:add",
  );
}

const crud = createResourceActions("group-permissions");

export const {
  fetchGroupPermissionList,
  fetchGroupPermissionAggregates,
  fetchGroupPermissionDetail,
  addGroupPermission,
  updateGroupPermission,
  deleteGroupPermissions,
} = defineResourceActions("group-permissions", {
  fetchGroupPermissionList: [
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
          .from(groupPermission)
          .innerJoin(group, eq(groupPermission.groupId, group.id))
          .where(where)
          .orderBy(group.name, groupPermission.resourceId)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(groupPermission)
          .where(where),
      ]);

      return {
        items,
        total: count ?? 0,
        nextCursor: null,
      };
    },
  ],

  fetchGroupPermissionAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const selection = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(selection).length === 0) return {};

      const [row] = await db
        .select(selection)
        .from(groupPermission)
        .where(where);
      return row;
    },
  ],

  fetchGroupPermissionDetail: [
    "read",
    async (id: number): Promise<GroupPermission> => {
      const [row] = await db
        .select(selection)
        .from(groupPermission)
        .innerJoin(group, eq(groupPermission.groupId, group.id))
        .where(eq(groupPermission.id, id))
        .limit(1);
      if (!row) throw new Error(`GroupPermission ${id} not found`);
      return row;
    },
  ],

  addGroupPermission: crud.add(async (tx, data: GroupPermissionFormValues) => {
    const parsed = groupPermissionSchema.parse(data);
    await assertCanGrantResourcePermission(parsed);
    const [result] = await tx
      .insert(groupPermission)
      .values({
        groupId: parsed.group_id,
        resourceId: parsed.resource_id,
        canRead: parsed.can_read,
        canAdd: parsed.can_add,
        canUpdate: parsed.can_update,
        canDelete: parsed.can_delete,
        allowed: parsed.allowed,
      })
      .returning({ id: groupPermission.id });
    return result.id;
  }),

  updateGroupPermission: crud.update(
    async (tx, id: number, data: GroupPermissionFormValues) => {
      const parsed = groupPermissionSchema.parse(data);
      await assertCanGrantResourcePermission(parsed);
      await tx
        .update(groupPermission)
        .set({
          groupId: parsed.group_id,
          resourceId: parsed.resource_id,
          canRead: parsed.can_read,
          canAdd: parsed.can_add,
          canUpdate: parsed.can_update,
          canDelete: parsed.can_delete,
          allowed: parsed.allowed,
        })
        .where(eq(groupPermission.id, id));
    },
  ),

  deleteGroupPermissions: crud.delete((tx, id: number) =>
    tx.delete(groupPermission).where(eq(groupPermission.id, id)),
  ),
});
