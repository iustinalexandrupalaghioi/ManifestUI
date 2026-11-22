"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentDraft, contentRevision, siteSettings } from "@/db/schema";
import { forgetContentRow } from "@/framework/content/server/forgetRow";
import { saveContentFromForm, withContentDraft, withContentStatuses } from "@/framework/content/server/index.server";
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
import { siteSettingsSchema, type SiteSettingsFormValues } from "./schema";

export type SiteSettings = typeof siteSettings.$inferSelect;

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  id: siteSettings.id,
  locale: siteSettings.locale,
  content: siteSettings.content,
  updatedAt: siteSettings.updatedAt,
  entryId: siteSettings.entryId,
  publishedAt: siteSettings.publishedAt,
  publishedBy: siteSettings.publishedBy,
};
const crud = createResourceActions("site-settings");

export const {
  fetchSiteSettingsList, fetchSiteSettingsDetail, addSiteSettings, updateSiteSettings, deleteSiteSettings,
  fetchSiteSettingsAggregates,
} = defineResourceActions("site-settings", {
  fetchSiteSettingsList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: siteSettings.id,
      });

      const [items, [{ count }]] = await Promise.all([
        db.select().from(siteSettings)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(siteSettings).where(where),
      ]);
      return {
        items: await withContentStatuses("navigation", items),
        total: count ?? 0,
        nextCursor: items.length === PAGE_SIZE
          ? extractCursor(items[items.length - 1], sortColumns)
          : null,
      };
    },
  ],
  fetchSiteSettingsAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(siteSettings).where(where);
      return row;
    },
  ],

  fetchSiteSettingsDetail: [
    "read",
    async (id: number) => {
      const [row] = await db.select().from(siteSettings)
        .where(eq(siteSettings.id, id))
        .limit(1);
      if (!row) throw new Error(`Navigation ${id} not found`);
      // The editor opens the draft when there is one.
      return withContentDraft("navigation", id, row);
    },
  ],
  addSiteSettings: [
    "add",
    async (_data: SiteSettingsFormValues): Promise<number> => {
      throw new Error("Navigation aren't added in the CMS.");
    },
  ],
  // Save draft: to the row while it isn't live, else to its draft (Publish makes it live).
  updateSiteSettings: [
    "update",
    async (id: number, data: SiteSettingsFormValues) => {
      await saveContentFromForm("navigation", id, siteSettingsSchema.parse(data));
    },
  ],
  deleteSiteSettings: [
    "delete",
    async (_ids: number[]): Promise<{ succeededIds: string[]; failures: { id: string; message: string }[] }> => {
      throw new Error("Navigation aren't deleted in the CMS.");
    },
  ],
});
