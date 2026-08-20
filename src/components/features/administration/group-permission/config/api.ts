"use server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { group_permission, group } from "@/db/schema";
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
import type { Cursor } from "@/framework/types/pagination";
import type { GroupPermission } from "@/app/types/administration/GroupPermission";
import {
  groupPermissionSchema,
  type GroupPermissionFormValues,
} from "./schema";

const PAGE_SIZE = 200;

const filterColumns: FilterColumnMap = {
  id: group_permission.id,
  group_id: group_permission.group_id,
  resource_id: group_permission.resource_id,
};

const selection = {
  id: group_permission.id,
  group_id: group_permission.group_id,
  resource_id: group_permission.resource_id,
  can_read: group_permission.can_read,
  can_add: group_permission.can_add,
  can_update: group_permission.can_update,
  can_delete: group_permission.can_delete,
  allowed: group_permission.allowed,
  group: { id: group.id, name: group.name },
};

async function assertCanGrantResourcePermission(
  data: GroupPermissionFormValues,
): Promise<void> {
  const callerId = await getCurrentUserId();
  if (!callerId) throw new Error("Not authenticated");
  const grantedPermissions = permissionStringsForResourceGrant(
    data.resource_id,
    data,
  );
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
    ) => {
      const where = buildWhereConditions(filters, filterColumns);

      const [items, [{ count }]] = await Promise.all([
        db
          .select(selection)
          .from(group_permission)
          .innerJoin(group, eq(group_permission.group_id, group.id))
          .where(where)
          .orderBy(group.name, group_permission.resource_id)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(group_permission)
          .where(where),
      ]);

      return {
        items: items as GroupPermission[],
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
        .from(group_permission)
        .where(where);
      return row;
    },
  ],

  fetchGroupPermissionDetail: [
    "read",
    async (id: number): Promise<GroupPermission> => {
      const [row] = await db
        .select(selection)
        .from(group_permission)
        .innerJoin(group, eq(group_permission.group_id, group.id))
        .where(eq(group_permission.id, id))
        .limit(1);
      if (!row) throw new Error(`GroupPermission ${id} not found`);
      return row as GroupPermission;
    },
  ],

  addGroupPermission: crud.add(async (tx, data: GroupPermissionFormValues) => {
    const parsed = groupPermissionSchema.parse(data);
    await assertCanGrantResourcePermission(parsed);
    const [result] = await tx
      .insert(group_permission)
      .values(parsed)
      .returning({ id: group_permission.id });
    return result.id;
  }),

  updateGroupPermission: crud.update(
    async (tx, id: number, data: GroupPermissionFormValues) => {
      const parsed = groupPermissionSchema.parse(data);
      await assertCanGrantResourcePermission(parsed);
      await tx
        .update(group_permission)
        .set(parsed)
        .where(eq(group_permission.id, id));
    },
  ),

  deleteGroupPermissions: crud.delete((tx, id: number) =>
    tx.delete(group_permission).where(eq(group_permission.id, id)),
  ),
});
