"use server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { role_resource_permissions, roles, resources } from "@/db/schema";
import {
  assertHasAllPermissions,
  defineResourceActions,
  getCurrentUserId,
  permissionStringsForResourceGrant,
} from "@/framework/authorization/rbac";
import { createResourceActions } from "@/framework/lib/transactionalAction";
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "@/framework/components/data-view/features/filtering/filters";
import { buildWhereConditions } from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { FilterColumnMap } from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { Cursor } from "@/framework/types/pagination";
import type { RolePermission } from "@/app/types/administration/RolePermission";
import { rolePermissionSchema, type RolePermissionFormValues } from "./schema";

// Small reference table (roles x resources) — pagination/keyset cursoring
// is intentionally skipped, a single page always covers it.
const PAGE_SIZE = 200;

const filterColumns: FilterColumnMap = {
  id: role_resource_permissions.id,
  role_id: role_resource_permissions.role_id,
  resource_id: role_resource_permissions.resource_id,
};

const selection = {
  id: role_resource_permissions.id,
  role_id: role_resource_permissions.role_id,
  resource_id: role_resource_permissions.resource_id,
  can_read: role_resource_permissions.can_read,
  can_add: role_resource_permissions.can_add,
  can_update: role_resource_permissions.can_update,
  can_delete: role_resource_permissions.can_delete,
  allowed: role_resource_permissions.allowed,
  role: { id: roles.id, name: roles.name },
  resource: { id: resources.id, name: resources.name, type: resources.type },
};

// Strip the UI-only `resource_type` field (see config/schema.ts) before it
// hits the DB.
function toRow(data: RolePermissionFormValues) {
  const { resource_type: _resource_type, ...row } = data;
  return row;
}

// Holding "role-permissions:add"/"update" alone must not let a caller grant
// a role permissions beyond their own — otherwise it's a confused-deputy
// escalation: a role scoped to "manage role permissions" could hand any
// role (including its own) every permission in the system.
async function assertCanGrantResourcePermission(
  data: RolePermissionFormValues,
): Promise<void> {
  const callerId = await getCurrentUserId();
  if (!callerId) throw new Error("Not authenticated");
  const grantedPermissions = await permissionStringsForResourceGrant(
    data.resource_id,
    data,
  );
  await assertHasAllPermissions(
    callerId,
    grantedPermissions,
    "role-permissions:add",
  );
}

const crud = createResourceActions("role-permissions");

export const {
  fetchRolePermissionList,
  fetchRolePermissionDetail,
  addRolePermission,
  updateRolePermission,
  deleteRolePermissions,
} = defineResourceActions("role-permissions", {
  fetchRolePermissionList: [
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
          .from(role_resource_permissions)
          .innerJoin(roles, eq(role_resource_permissions.role_id, roles.id))
          .innerJoin(
            resources,
            eq(role_resource_permissions.resource_id, resources.id),
          )
          .where(where)
          .orderBy(roles.name, resources.id)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(role_resource_permissions)
          .where(where),
      ]);

      return {
        items: items as RolePermission[],
        total: count ?? 0,
        nextCursor: null,
      };
    },
  ],

  fetchRolePermissionDetail: [
    "read",
    async (id: number): Promise<RolePermission> => {
      const [row] = await db
        .select(selection)
        .from(role_resource_permissions)
        .innerJoin(roles, eq(role_resource_permissions.role_id, roles.id))
        .innerJoin(
          resources,
          eq(role_resource_permissions.resource_id, resources.id),
        )
        .where(eq(role_resource_permissions.id, id))
        .limit(1);
      if (!row) throw new Error(`RolePermission ${id} not found`);
      return row as RolePermission;
    },
  ],

  addRolePermission: crud.add(async (tx, data: RolePermissionFormValues) => {
    const parsed = rolePermissionSchema.parse(data);
    await assertCanGrantResourcePermission(parsed);
    const [result] = await tx
      .insert(role_resource_permissions)
      .values(toRow(parsed))
      .returning({ id: role_resource_permissions.id });
    return result.id;
  }),

  updateRolePermission: crud.update(
    async (tx, id: number, data: RolePermissionFormValues) => {
      const parsed = rolePermissionSchema.parse(data);
      await assertCanGrantResourcePermission(parsed);
      await tx
        .update(role_resource_permissions)
        .set(toRow(parsed))
        .where(eq(role_resource_permissions.id, id));
    },
  ),

  deleteRolePermissions: crud.delete((tx, id: number) =>
    tx
      .delete(role_resource_permissions)
      .where(eq(role_resource_permissions.id, id)),
  ),
});
