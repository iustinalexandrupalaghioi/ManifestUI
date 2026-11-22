"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentDraft, contentRevision, service } from "@/db/schema";
import { forgetContentRow } from "@/framework/content/server/forgetRow";
import { afterContentDelete, saveContentFromForm, withContentDraft, withContentStatuses } from "@/framework/content/server/index.server";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
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
import type { GroupByRule } from "@/framework/components/data-view/features/grouping/grouping";
import type { AggregateRule } from "@/framework/components/data-view/features/aggregates/aggregates";
import { buildAggregateSelection } from "@/framework/components/data-view/features/filtering/drizzle-filters";

import type { Cursor } from "@/framework/types/pagination";
import { serviceSchema, type ServiceFormValues } from "./schema";

export type Service = typeof service.$inferSelect;

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  id: service.id,
  slug: service.slug,
  locale: service.locale,
  position: service.position,
  title: service.title,
  summary: service.summary,
  body: service.body,
  updatedAt: service.updatedAt,
  entryId: service.entryId,
  publishedAt: service.publishedAt,
  publishedBy: service.publishedBy,
};
const crud = createResourceActions("services");

export const {
  fetchServiceList, fetchServiceDetail, addService, updateService, deleteService,
  fetchServiceAggregates,
} = defineResourceActions("services", {
  fetchServiceList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: service.id,
      });

      const [items, [{ count }]] = await Promise.all([
        db.select().from(service)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(service).where(where),
      ]);
      return {
        items: await withContentStatuses("service", items),
        total: count ?? 0,
        nextCursor: items.length === PAGE_SIZE
          ? extractCursor(items[items.length - 1], sortColumns)
          : null,
      };
    },
  ],
  fetchServiceAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(service).where(where);
      return row;
    },
  ],

  fetchServiceDetail: [
    "read",
    async (id: number) => {
      const [row] = await db.select().from(service)
        .where(eq(service.id, id))
        .limit(1);
      if (!row) throw new Error(`Service ${id} not found`);
      // The editor opens the draft when there is one.
      return withContentDraft("service", id, row);
    },
  ],
  addService: crud.add(async (tx, data: ServiceFormValues) => {
    const parsed = serviceSchema.parse(data);
    // Not live until published; a new language row joins the entry with this address.
    const [row] = await tx.insert(service).values({ ...parsed, entryId: sql`coalesce((select ${service.entryId} from ${service} where ${service.slug} = ${parsed.slug} limit 1), gen_random_uuid())`, publishedAt: null }).returning({ id: service.id });
    return row.id;
  }),
  // Save draft: to the row while it isn't live, else to its draft (Publish makes it live).
  updateService: [
    "update",
    async (id: number, data: ServiceFormValues) => {
      await saveContentFromForm("service", id, serviceSchema.parse(data));
    },
  ],
  // The row's draft and versions go with it; once committed, content.onChange hears of it.
  deleteService: afterContentDelete("service", crud.delete(async (tx, id: number) => {
    await forgetContentRow(tx, { draft: contentDraft, revision: contentRevision }, "service", id);
    return tx.delete(service).where(eq(service.id, id));
  })),
});
