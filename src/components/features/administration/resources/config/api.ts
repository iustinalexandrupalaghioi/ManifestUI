"use server";
import { and, eq, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { db } from "@/db";
import { resources } from "@/db/schema";
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
import type { Resource } from "@/app/types/administration/Resource";
import { resourceSchema, type ResourceFormValues } from "./schema";

const PAGE_SIZE = 50;

const parentResources = alias(resources, "parent_resources");

const filterColumns: FilterColumnMap = {
  id: resources.id,
  name: resources.name,
  parent_resource_id: resources.parent_resource_id,
  type: resources.type,
  label: resources.label,
  singular_label: resources.singular_label,
  table_name: resources.table_name,
  description: resources.description,
  created_at: resources.created_at,
};

const selection = {
  id: resources.id,
  name: resources.name,
  parent_resource_id: resources.parent_resource_id,
  type: resources.type,
  label: resources.label,
  singular_label: resources.singular_label,
  table_name: resources.table_name,
  description: resources.description,
  created_at: resources.created_at,
  parent: { id: parentResources.id, name: parentResources.name },
};

const crud = createResourceActions("resources");

export const {
  fetchResourceList,
  fetchResourceDetail,
  addResource,
  updateResource,
  deleteResources,
} = defineResourceActions("resources", {
  fetchResourceList: [
    "read",
    async (
      sorting: SortRule[],
      filters: FilterRule[],
      cursor: Cursor | null,
    ) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: resources.id,
      });
      const orderBy = buildOrderBy(sortColumns);
      const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));

      const [items, [{ count }]] = await Promise.all([
        db
          .select(selection)
          .from(resources)
          .leftJoin(
            parentResources,
            eq(resources.parent_resource_id, parentResources.id),
          )
          .where(seekWhere)
          .orderBy(...orderBy)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(resources)
          .where(where),
      ]);

      const nextCursor =
        items.length === PAGE_SIZE
          ? extractCursor(items[items.length - 1], sortColumns)
          : null;

      return { items: items as Resource[], total: count ?? 0, nextCursor };
    },
  ],

  fetchResourceDetail: [
    "read",
    async (id: number): Promise<Resource> => {
      const [row] = await db
        .select(selection)
        .from(resources)
        .leftJoin(
          parentResources,
          eq(resources.parent_resource_id, parentResources.id),
        )
        .where(eq(resources.id, id))
        .limit(1);
      if (!row) throw new Error(`Resource ${id} not found`);
      return row as Resource;
    },
  ],

  addResource: crud.add(async (tx, data: ResourceFormValues) => {
    const parsed = resourceSchema.parse(data);
    const [result] = await tx
      .insert(resources)
      .values(parsed)
      .returning({ id: resources.id });
    return result.id;
  }),

  updateResource: crud.update(
    async (tx, id: number, data: ResourceFormValues) => {
      const parsed = resourceSchema.parse(data);
      await tx
        .update(resources)
        .set({
          label: parsed.label,
          singular_label: parsed.singular_label,
          table_name: parsed.table_name,
          description: parsed.description,
        })
        .where(eq(resources.id, id));
    },
  ),

  deleteResources: crud.delete((tx, id: number) =>
    tx.delete(resources).where(eq(resources.id, id)),
  ),
});
