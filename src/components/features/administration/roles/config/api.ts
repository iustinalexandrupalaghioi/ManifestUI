"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/rbac";
import { createResourceActions } from "@/framework/lib/transactionalAction";
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
import type { Cursor } from "@/framework/types/pagination";
import type { Role } from "@/app/types/administration/Role";
import { roleSchema, type RoleFormValues } from "./schema";

const PAGE_SIZE = 50;

const filterColumns: FilterColumnMap = {
  id: roles.id,
  name: roles.name,
  description: roles.description,
  created_at: roles.created_at,
};

const selection = {
  id: roles.id,
  name: roles.name,
  description: roles.description,
  created_at: roles.created_at,
};

const crud = createResourceActions("roles");

export const { fetchRoleList, fetchRoleDetail, addRole, updateRole, deleteRoles } =
  defineResourceActions("roles", {
    fetchRoleList: [
      "read",
      async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null) => {
        const where = buildWhereConditions(filters, filterColumns);
        const sortColumns = resolveSortColumns(sorting, filterColumns, {
          key: "id",
          column: roles.id,
        });
        const orderBy = buildOrderBy(sortColumns);
        const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));

        const [items, [{ count }]] = await Promise.all([
          db
            .select(selection)
            .from(roles)
            .where(seekWhere)
            .orderBy(...orderBy)
            .limit(PAGE_SIZE),
          db
            .select({ count: sql<number>`count(*)::int` })
            .from(roles)
            .where(where),
        ]);

        const nextCursor =
          items.length === PAGE_SIZE
            ? extractCursor(items[items.length - 1], sortColumns)
            : null;

        return { items: items as Role[], total: count ?? 0, nextCursor };
      },
    ],

    fetchRoleDetail: [
      "read",
      async (id: number): Promise<Role> => {
        const [row] = await db
          .select(selection)
          .from(roles)
          .where(eq(roles.id, id))
          .limit(1);
        if (!row) throw new Error(`Role ${id} not found`);
        return row as Role;
      },
    ],

    addRole: crud.add(async (tx, data: RoleFormValues) => {
      const parsed = roleSchema.parse(data);
      const [result] = await tx.insert(roles).values(parsed).returning({ id: roles.id });
      return result.id;
    }),

    updateRole: crud.update(async (tx, id: number, data: RoleFormValues) => {
      const parsed = roleSchema.parse(data);
      await tx.update(roles).set(parsed).where(eq(roles.id, id));
    }),

    deleteRoles: crud.delete((tx, id: number) =>
      tx.delete(roles).where(eq(roles.id, id)),
    ),
  });
