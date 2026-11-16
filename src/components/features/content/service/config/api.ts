"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { service } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { createResourceActions } from "@/app/[locale]/cms/createResourceActions";
import { afterCommit } from "@/framework/lib/transactionalAction";
import { refreshCollection } from "@/components/site/cache";
import type { SortRule } from "@/framework/components/data-view/core/tanstack-augmentations";
import type { FilterRule } from "@/framework/components/data-view/features/filtering/filters";
import {
  buildAggregateSelection,
  buildKeysetWhere,
  buildOrderBy,
  buildWhereConditions,
  extractCursor,
  resolveSortColumns,
  type FilterColumnMap,
} from "@/framework/components/data-view/features/filtering/drizzle-filters";
import type { AggregateRule } from "@/framework/components/data-view/features/aggregates/aggregates";
import type { GroupByRule } from "@/framework/components/data-view/features/grouping/grouping";
import type { Cursor } from "@/framework/types/pagination";
import { serviceSchema, type ServiceFormValues } from "./schema";

const PAGE_SIZE = 50;

const filterColumns: FilterColumnMap = {
  id: service.id,
  title: service.title,
  summary: service.summary,
  slug: service.slug,
  locale: service.locale,
  position: service.position,
  published: service.published,
  updatedAt: service.updatedAt,
};

const crud = createResourceActions("services");

/** Every page showing the "services" collection updates once a save commits. */
const refresh = () => refreshCollection("services");

export const {
  fetchServiceList,
  fetchServiceAggregates,
  fetchServiceDetail,
  addService,
  updateService,
  deleteServices,
} = defineResourceActions("services", {
  fetchServiceList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, { key: "id", column: service.id });
      const [items, [{ count }]] = await Promise.all([
        db
          .select()
          .from(service)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(service).where(where),
      ]);
      const nextCursor = items.length === PAGE_SIZE ? extractCursor(items[items.length - 1], sortColumns) : null;
      return { items, total: count ?? 0, nextCursor };
    },
  ],

  fetchServiceAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const selection = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(selection).length === 0) return {};
      const [row] = await db.select(selection).from(service).where(buildWhereConditions(filters, filterColumns));
      return row;
    },
  ],

  fetchServiceDetail: [
    "read",
    async (id: number): Promise<typeof service.$inferSelect> => {
      const [row] = await db.select().from(service).where(eq(service.id, id)).limit(1);
      if (!row) throw new Error(`Service ${id} not found`);
      return row;
    },
  ],

  addService: afterCommit(
    crud.add(async (tx, data: ServiceFormValues) => {
      const parsed = serviceSchema.parse(data);
      const [result] = await tx.insert(service).values(parsed).returning({ id: service.id });
      return result.id;
    }),
    (id) => {
      refresh();
      return id;
    },
  ),

  updateService: afterCommit(
    crud.update(async (tx, id: number, data: ServiceFormValues) => {
      const parsed = serviceSchema.parse(data);
      await tx
        .update(service)
        .set({ ...parsed, updatedAt: sql`now()` })
        .where(eq(service.id, id));
    }),
    () => {
      refresh();
    },
  ),

  deleteServices: afterCommit(
    crud.delete((tx, id: number) => tx.delete(service).where(eq(service.id, id))),
    (result) => {
      if (result.succeededIds.length) refresh();
      return result;
    },
  ),
});
