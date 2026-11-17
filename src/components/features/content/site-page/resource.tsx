"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { sitePage } from "@/db/schema";
import {
  fetchSitePageDetail,
  fetchSitePageList,
  fetchSitePageAggregates,
  addSitePage,
  updateSitePage,
  deleteSitePages,
} from "./config/api";
import { sitePagesForm } from "./config/form";
import { sitePageSchema, type SitePageFormValues } from "./config/schema";
import { sitePageColumns, sitePageListColumns } from "./config/columns";
import { sitePagesDescriptor } from "./config/descriptor";

/** Marketing-site pages (legal pages first), edited with a live Markdown preview. */
export const sitePagesResource = defineResource<typeof sitePage.$inferSelect, SitePageFormValues>({
  descriptor: sitePagesDescriptor,

  presentation: {
    open: "page",
    add: "page",
  },

  data: {
    fetchList: fetchSitePageList,
    fetchAggregates: fetchSitePageAggregates,
    fetchDetail: fetchSitePageDetail,
    mutations: { add: addSitePage, update: updateSitePage, delete: deleteSitePages },
  },

  form: {
    schema: sitePageSchema,
    emptyValues: {
      slug: "",
      locale: "en",
      title: "",
      description: "",
      kind: "text",
      body: "",
      sections: [],
      published: false,
    },
    layout: sitePagesForm,
  },

  dataView: {
    overview: {
      dataTableColumns: sitePageColumns,
      dataListColumns: sitePageListColumns,
      features: { grouping: false, aggregates: false },
      defaultView: {
        table: { sorting: [{ column: "slug" }, { column: "locale" }] },
        list: { sorting: [{ column: "slug" }, { column: "locale" }] },
      },
    },
    pickup: {
      dataTableColumns: sitePageColumns,
      dataListColumns: sitePageListColumns,
      features: { grouping: false, aggregates: false },
    },
  },
});

export const { hooks: sitePageHooks, components: sitePageComponents } = sitePagesResource;

export const {
  Overview: SitePageOverview,
  AddPage: SitePageAddPage,
  DetailPage: SitePageDetailPage,
} = sitePageComponents;
