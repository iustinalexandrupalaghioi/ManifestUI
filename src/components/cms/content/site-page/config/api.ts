"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentDraft, contentRevision, sitePage } from "@/db/schema";
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
import { sitePageSchema, type SitePageFormValues } from "./schema";

export type SitePage = typeof sitePage.$inferSelect;

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  id: sitePage.id,
  slug: sitePage.slug,
  locale: sitePage.locale,
  title: sitePage.title,
  description: sitePage.description,
  kind: sitePage.kind,
  body: sitePage.body,
  sections: sitePage.sections,
  updatedAt: sitePage.updatedAt,
  entryId: sitePage.entryId,
  publishedAt: sitePage.publishedAt,
  publishedBy: sitePage.publishedBy,
};
const crud = createResourceActions("site-pages");

export const {
  fetchSitePageList, fetchSitePageDetail, addSitePage, updateSitePage, deleteSitePage,
  fetchSitePageAggregates,
} = defineResourceActions("site-pages", {
  fetchSitePageList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: sitePage.id,
      });

      const [items, [{ count }]] = await Promise.all([
        db.select().from(sitePage)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(sitePage).where(where),
      ]);
      return {
        items: await withContentStatuses("page", items),
        total: count ?? 0,
        nextCursor: items.length === PAGE_SIZE
          ? extractCursor(items[items.length - 1], sortColumns)
          : null,
      };
    },
  ],
  fetchSitePageAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(sitePage).where(where);
      return row;
    },
  ],

  fetchSitePageDetail: [
    "read",
    async (id: number) => {
      const [row] = await db.select().from(sitePage)
        .where(eq(sitePage.id, id))
        .limit(1);
      if (!row) throw new Error(`Site page ${id} not found`);
      // The editor opens the draft when there is one.
      return withContentDraft("page", id, row);
    },
  ],
  addSitePage: crud.add(async (tx, data: SitePageFormValues) => {
    const parsed = sitePageSchema.parse(data);
    // Not live until published; a new language row joins the entry with this address.
    const [row] = await tx.insert(sitePage).values({ ...parsed, entryId: sql`coalesce((select ${sitePage.entryId} from ${sitePage} where ${sitePage.slug} = ${parsed.slug} limit 1), gen_random_uuid())`, publishedAt: null }).returning({ id: sitePage.id });
    return row.id;
  }),
  // Save draft: to the row while it isn't live, else to its draft (Publish makes it live).
  updateSitePage: [
    "update",
    async (id: number, data: SitePageFormValues) => {
      await saveContentFromForm("page", id, sitePageSchema.parse(data));
    },
  ],
  // The row's draft and versions go with it; once committed, content.onChange hears of it.
  deleteSitePage: afterContentDelete("page", crud.delete(async (tx, id: number) => {
    await forgetContentRow(tx, { draft: contentDraft, revision: contentRevision }, "page", id);
    return tx.delete(sitePage).where(eq(sitePage.id, id));
  })),
});
