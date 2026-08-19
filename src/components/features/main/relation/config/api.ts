"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { relation } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { getCurrentUserId } from "@/framework/authorization/lib/getCurrentUserId";
import { hasServerPermission } from "@/framework/authorization/lib/permissions";
import { createResourceActions } from "@/app/[locale]/cms/createResourceActions";
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
  id: relation.id,
  first_name: relation.first_name,
  last_name: relation.last_name,
  maiden_name: relation.maiden_name,
  age: relation.age,
  gender: relation.gender,
  email: relation.email,
  phone: relation.phone,
  username: relation.username,
  birth_date: relation.birth_date,
  blood_group: relation.blood_group,
  height: relation.height,
  weight: relation.weight,
  eye_color: relation.eye_color,
  hair_color: relation.hair_color,
  hair_type: relation.hair_type,
  created_at: relation.created_at,
};

const selection = {
  id: relation.id,
  first_name: relation.first_name,
  last_name: relation.last_name,
  maiden_name: relation.maiden_name,
  age: relation.age,
  height: sql<number>`${relation.height}::float8`,
  weight: sql<number>`${relation.weight}::float8`,
  gender: relation.gender,
  email: relation.email,
  phone: relation.phone,
  username: relation.username,
  birth_date: relation.birth_date,
  image: relation.image,
  blood_group: relation.blood_group,
  eye_color: relation.eye_color,
  hair_color: relation.hair_color,
  hair_type: relation.hair_type,
  created_at: relation.created_at,
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
    async (
      sorting: SortRule[],
      filters: FilterRule[],
      cursor: Cursor | null,
    ) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: relation.id,
      });
      const orderBy = buildOrderBy(sortColumns);
      const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));

      const [items, [{ count }]] = await Promise.all([
        db
          .select(selection)
          .from(relation)
          .where(seekWhere)
          .orderBy(...orderBy)
          .limit(PAGE_SIZE),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(relation)
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
        .from(relation)
        .where(eq(relation.id, id))
        .limit(1);
      if (!row) throw new Error(`Relation ${id} not found`);
      return row as Relation;
    },
  ],

  addRelation: resourceAction.add(async (tx, data: RelationFormValues) => {
    const parsed = relationSchema.parse(data);
    const [result] = await tx
      .insert(relation)
      .values(toRelationRow(parsed))
      .returning({ id: relation.id });
    return result.id;
  }),

  updateRelation: resourceAction.update(
    async (tx, id: number, data: RelationFormValues) => {
      const parsed = relationSchema.parse(data);
      const userId = await getCurrentUserId();
      const canFullyUpdate =
        !!userId && (await hasServerPermission(userId, "relations:update"));

      if (!canFullyUpdate) {
        await tx
          .update(relation)
          .set({ image: parsed.image ?? "" })
          .where(and(eq(relation.id, id), eq(relation.image, "")));
        return;
      }

      await tx
        .update(relation)
        .set(toRelationRow(parsed))
        .where(eq(relation.id, id));
    },
    { alsoAllow: ["add"] },
  ),

  deleteRelations: resourceAction.delete((tx, id: number) =>
    tx.delete(relation).where(eq(relation.id, id)),
  ),
});
