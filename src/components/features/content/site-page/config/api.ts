"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { sitePage } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { createResourceActions } from "@/app/[locale]/cms/createResourceActions";
import { afterCommit } from "@/framework/lib/transactionalAction";
import { refreshSitePages } from "@/components/site/internal/cache";
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
import { buildGroupingSortRules } from "@/framework/components/data-view/features/grouping/grouping";
import type { GroupByRule } from "@/framework/components/data-view/features/grouping/grouping";
import type { Cursor } from "@/framework/types/pagination";
import { sitePageSchema, type SitePageFormValues } from "./schema";

const PAGE_SIZE = 50;

const filterColumns: FilterColumnMap = {
  id: sitePage.id,
  slug: sitePage.slug,
  locale: sitePage.locale,
  kind: sitePage.kind,
  title: sitePage.title,
  published: sitePage.published,
  updatedAt: sitePage.updatedAt,
};

const listSelection = {
  id: sitePage.id,
  slug: sitePage.slug,
  locale: sitePage.locale,
  title: sitePage.title,
  description: sitePage.description,
  kind: sitePage.kind,
  body: sitePage.body,
  sections: sitePage.sections,
  published: sitePage.published,
  updatedAt: sitePage.updatedAt,
};

const crud = createResourceActions("site-pages");

export const {
  fetchSitePageList,
  fetchSitePageAggregates,
  fetchSitePageDetail,
  addSitePage,
  updateSitePage,
  deleteSitePages,
} = defineResourceActions("site-pages", {
  fetchSitePageList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, groupBy: GroupByRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const effectiveSorting = groupBy.length ? [...buildGroupingSortRules(groupBy), ...sorting] : sorting;
      const sortColumns = resolveSortColumns(effectiveSorting, filterColumns, { key: "id", column: sitePage.id });
      const orderBy = buildOrderBy(sortColumns);

      if (groupBy.length > 0) {
        const [items, [{ count }]] = await Promise.all([
          db.select(listSelection).from(sitePage).where(where).orderBy(...orderBy),
          db.select({ count: sql<number>`count(*)::int` }).from(sitePage).where(where),
        ]);
        return { items, total: count ?? 0, nextCursor: null };
      }

      const seekWhere = and(where, buildKeysetWhere(sortColumns, cursor));
      const [items, [{ count }]] = await Promise.all([
        db.select(listSelection).from(sitePage).where(seekWhere).orderBy(...orderBy).limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(sitePage).where(where),
      ]);
      const nextCursor = items.length === PAGE_SIZE ? extractCursor(items[items.length - 1], sortColumns) : null;
      return { items, total: count ?? 0, nextCursor };
    },
  ],

  fetchSitePageAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const selection = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(selection).length === 0) return {};
      const [row] = await db.select(selection).from(sitePage).where(where);
      return row;
    },
  ],

  fetchSitePageDetail: [
    "read",
    async (id: number): Promise<typeof sitePage.$inferSelect> => {
      const [row] = await db.select().from(sitePage).where(eq(sitePage.id, id)).limit(1);
      if (!row) throw new Error(`Site page ${id} not found`);
      return row;
    },
  ],

  // Public pages are cached; each save refreshes the addresses it touched once committed.
  addSitePage: afterCommit(
    crud.add(async (tx, data: SitePageFormValues) => {
      const parsed = sitePageSchema.parse(data);
      const [result] = await tx.insert(sitePage).values(parsed).returning({ id: sitePage.id });
      return result.id;
    }),
    (id, data) => {
      refreshSitePages([{ slug: sitePageSchema.shape.slug.parse(data.slug), locale: data.locale }]);
      return id;
    },
  ),

  updateSitePage: afterCommit(
    crud.update(async (tx, id: number, data: SitePageFormValues) => {
      const parsed = sitePageSchema.parse(data);
      const [before] = await tx.select({ slug: sitePage.slug, locale: sitePage.locale }).from(sitePage).where(eq(sitePage.id, id));
      await tx
        .update(sitePage)
        .set({ ...parsed, updatedAt: sql`now()` })
        .where(eq(sitePage.id, id));
      // The old address too, when the slug or language changed.
      return before ? [before, { slug: parsed.slug, locale: parsed.locale }] : [{ slug: parsed.slug, locale: parsed.locale }];
    }),
    (pages) => {
      refreshSitePages(pages);
    },
  ),

  deleteSitePages: afterCommit(
    crud.delete((tx, id: number) => tx.delete(sitePage).where(eq(sitePage.id, id))),
    (result) => {
      if (result.succeededIds.length) refreshSitePages();
      return result;
    },
  ),
});
