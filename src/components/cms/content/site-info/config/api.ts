"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { contentDraft, contentRevision, siteInfo } from "@/db/schema";
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
import { siteInfoSchema, type SiteInfoFormValues } from "./schema";

export type SiteInfo = typeof siteInfo.$inferSelect;

const PAGE_SIZE = 100;
const filterColumns: FilterColumnMap = {
  id: siteInfo.id,
  locale: siteInfo.locale,
  siteName: siteInfo.siteName,
  description: siteInfo.description,
  updatedAt: siteInfo.updatedAt,
  entryId: siteInfo.entryId,
  publishedAt: siteInfo.publishedAt,
  publishedBy: siteInfo.publishedBy,
};
const crud = createResourceActions("site-info");

export const {
  fetchSiteInfoList, fetchSiteInfoDetail, addSiteInfo, updateSiteInfo, deleteSiteInfo,
  fetchSiteInfoAggregates,
} = defineResourceActions("site-info", {
  fetchSiteInfoList: [
    "read",
    async (sorting: SortRule[], filters: FilterRule[], cursor: Cursor | null, _groupBy: GroupByRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const sortColumns = resolveSortColumns(sorting, filterColumns, {
        key: "id",
        column: siteInfo.id,
      });

      const [items, [{ count }]] = await Promise.all([
        db.select().from(siteInfo)
          .where(and(where, buildKeysetWhere(sortColumns, cursor)))
          .orderBy(...buildOrderBy(sortColumns))
          .limit(PAGE_SIZE),
        db.select({ count: sql<number>`count(*)::int` }).from(siteInfo).where(where),
      ]);
      return {
        items: await withContentStatuses("siteInfo", items),
        total: count ?? 0,
        nextCursor: items.length === PAGE_SIZE
          ? extractCursor(items[items.length - 1], sortColumns)
          : null,
      };
    },
  ],
  fetchSiteInfoAggregates: [
    "read",
    async (rules: AggregateRule[], filters: FilterRule[]) => {
      const where = buildWhereConditions(filters, filterColumns);
      const totals = buildAggregateSelection(rules, filterColumns);
      if (Object.keys(totals).length === 0) return {};
      const [row] = await db.select(totals).from(siteInfo).where(where);
      return row;
    },
  ],

  fetchSiteInfoDetail: [
    "read",
    async (id: number) => {
      const [row] = await db.select().from(siteInfo)
        .where(eq(siteInfo.id, id))
        .limit(1);
      if (!row) throw new Error(`Site info ${id} not found`);
      // The editor opens the draft when there is one.
      return withContentDraft("siteInfo", id, row);
    },
  ],
  addSiteInfo: [
    "add",
    async (_data: SiteInfoFormValues): Promise<number> => {
      throw new Error("Site info aren't added in the CMS.");
    },
  ],
  // Save draft: to the row while it isn't live, else to its draft (Publish makes it live).
  updateSiteInfo: [
    "update",
    async (id: number, data: SiteInfoFormValues) => {
      await saveContentFromForm("siteInfo", id, siteInfoSchema.parse(data));
    },
  ],
  deleteSiteInfo: [
    "delete",
    async (_ids: number[]): Promise<{ succeededIds: string[]; failures: { id: string; message: string }[] }> => {
      throw new Error("Site info aren't deleted in the CMS.");
    },
  ],
});
