"use server";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { siteSettings } from "@/db/schema";
import { defineResourceActions } from "@/framework/authorization/lib/defineResourceActions";
import { createResourceActions } from "@/app/[locale]/cms/createResourceActions";
import { afterCommit } from "@/framework/lib/transactionalAction";
import { refreshSiteSettings } from "@/components/site/internal/cache";
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
import { siteSettingsSchema, type SiteSettingsFormValues } from "./schema";

const PAGE_SIZE = 50;

const filterColumns: FilterColumnMap = {
  id: siteSettings.id,
  locale: siteSettings.locale,
  updatedAt: siteSettings.updatedAt,
};

const listSelection = {
  id: siteSettings.id,
  locale: siteSettings.locale,
  content: siteSettings.content,
  updatedAt: siteSettings.updatedAt,
};

const crud = createResourceActions("site-settings");

export const {
  fetchSiteSettingsList,
  fetchSiteSettingsAggregates,
  fetchSiteSettingsDetail,
  addSiteSettings,
  updateSiteSettings,
  deleteSiteSettings,
} = defineResourceActions("site-settings", {
  // One record per locale, so no grouping and at most a page of rows.
  fetchSiteSettingsList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, { key: "id", column: siteSettings.id });
      const [items, [{ count }]] = await Promise.all([
        db
          .select(listSelection)
          .from(siteSettings)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(siteSettings).where(where),
      ]);
      const nextCursor = items.length === PAGE_SIZE ? extractCursor(items[items.length - 1], sortColumns) : null;
      return { items, total: count ?? 0, nextCursor };
    },
  ],

  fetchSiteSettingsAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const selection = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(selection).length === 0) return {};
      const [row] = await db.select(selection).from(siteSettings).where(buildWhereConditions(filters, filterColumns));
      return row;
    },
  ],

  fetchSiteSettingsDetail: [
    "read",
    async (id: number): Promise<typeof siteSettings.$inferSelect> => {
      const [row] = await db.select().from(siteSettings).where(eq(siteSettings.id, id)).limit(1);
      if (!row) throw new Error(`Site settings ${id} not found`);
      return row;
    },
  ],

  // Every public page shows the header and footer; saves refresh them once committed.
  addSiteSettings: afterCommit(
    crud.add(async (tx, data: SiteSettingsFormValues) => {
      const parsed = siteSettingsSchema.parse(data);
      const [result] = await tx.insert(siteSettings).values(parsed).returning({ id: siteSettings.id });
      return result.id;
    }),
    (id, data) => {
      refreshSiteSettings([data.locale]);
      return id;
    },
  ),

  updateSiteSettings: afterCommit(
    crud.update(async (tx, id: number, data: SiteSettingsFormValues) => {
      const parsed = siteSettingsSchema.parse(data);
      const [before] = await tx.select({ locale: siteSettings.locale }).from(siteSettings).where(eq(siteSettings.id, id));
      await tx
        .update(siteSettings)
        .set({ ...parsed, updatedAt: sql`now()` })
        .where(eq(siteSettings.id, id));
      return before ? [before.locale, parsed.locale] : [parsed.locale];
    }),
    (locales) => {
      refreshSiteSettings(locales);
    },
  ),

  deleteSiteSettings: afterCommit(
    crud.delete((tx, id: number) => tx.delete(siteSettings).where(eq(siteSettings.id, id))),
    (result) => {
      if (result.succeededIds.length) refreshSiteSettings(["en", "ro"]);
      return result;
    },
  ),
});
