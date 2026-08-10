"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { relations } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/rbac";
import { createResourceActions } from "@/app/createResourceActions";
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
import type { Relation } from "@/app/types/main/Relation";
import { relationSchema, type RelationFormValues } from "./schema";
import { relationsDescriptor } from "./descriptor";

const PAGE_SIZE = 50;

const filterColumns: FilterColumnMap = {
  id: relations.id,
  first_name: relations.first_name,
  last_name: relations.last_name,
  maiden_name: relations.maiden_name,
  age: relations.age,
  gender: relations.gender,
  email: relations.email,
  phone: relations.phone,
  username: relations.username,
  birth_date: relations.birth_date,
  blood_group: relations.blood_group,
  height: relations.height,
  weight: relations.weight,
  eye_color: relations.eye_color,
  hair_color: relations.hair_color,
  hair_type: relations.hair_type,
  created_at: relations.created_at,
};

const selection = {
  id: relations.id,
  first_name: relations.first_name,
  last_name: relations.last_name,
  maiden_name: relations.maiden_name,
  age: relations.age,
  height: sql<number>`${relations.height}::float8`,
  weight: sql<number>`${relations.weight}::float8`,
  gender: relations.gender,
  email: relations.email,
  phone: relations.phone,
  username: relations.username,
  birth_date: relations.birth_date,
  image: relations.image,
  blood_group: relations.blood_group,
  eye_color: relations.eye_color,
  hair_color: relations.hair_color,
  hair_type: relations.hair_type,
  created_at: relations.created_at,
};

function toRelationRow(data: RelationFormValues) {
  return {
    ...data,
    height: String(data.height),
    weight: String(data.weight),
  };
}

const resourceAction = createResourceActions(relationsDescriptor.id);

export const {
  fetchRelationList,
  fetchRelationDetail,
  addRelation,
  updateRelation,
  deleteRelations,
} = defineResourceActions("relations", {
  fetchRelationList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null) => {
    const where = buildWhereConditions(filters, filterColumns);
    const sortColumns = resolveSortColumns(sorting, filterColumns, {
      key: "id",
      column: relations.id,
    });
    const orderBy = buildOrderBy(sortColumns);
    const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));

    const [items, [{ count }]] = await Promise.all([
      db
        .select(selection)
        .from(relations)
        .where(seekWhere)
        .orderBy(...orderBy)
        .limit(PAGE_SIZE),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(relations)
        .where(where),
    ]);

    const nextCursor =
      items.length === PAGE_SIZE
        ? extractCursor(items[items.length - 1], sortColumns)
        : null;

      return { items: items as Relation[], total: count ?? 0, nextCursor };
    },
  ],

  fetchRelationDetail: [
    "read",
    async (id: number): Promise<Relation> => {
      const [row] = await db
        .select(selection)
        .from(relations)
        .where(eq(relations.id, id))
        .limit(1);
      if (!row) throw new Error(`Relation ${id} not found`);
      return row as unknown as Relation;
    },
  ],

  addRelation: resourceAction.add(async (tx, data: RelationFormValues) => {
    const parsed = relationSchema.parse(data);
    const [result] = await tx
      .insert(relations)
      .values(toRelationRow(parsed))
      .returning({ id: relations.id });
    return result.id;
  }),

  updateRelation: resourceAction.update(
    async (tx, id: number, data: RelationFormValues) => {
      const parsed = relationSchema.parse(data);
      await tx
        .update(relations)
        .set(toRelationRow(parsed))
        .where(eq(relations.id, id));
    },
  ),

  deleteRelations: resourceAction.delete((tx, id: number) =>
    tx.delete(relations).where(eq(relations.id, id)),
  ),
});
