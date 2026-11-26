"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchSitePageList, fetchSitePageDetail, addSitePage, updateSitePage, deleteSitePage, fetchSitePageAggregates } from "./config/api";
import { sitePageColumns, sitePageListColumns, sitePagePickupColumns } from "./config/columns";
import { sitePageForm } from "./config/form";
import { sitePagesDescriptor } from "./config/descriptor";
import { sitePageSchema, type SitePageFormValues } from "./config/schema";
import type { SitePage } from "./config/api";
import { contentHistoryRelation, contentHistoryTab } from "@/components/cms/content/history";

export const sitePagesResource = defineResource<
  SitePage,
  SitePageFormValues,
  number
>({
  descriptor: sitePagesDescriptor,
  idField: "id",
  presentation: { open: "page", add: "page" },
  data: {
    fetchList: fetchSitePageList,
    fetchAggregates: fetchSitePageAggregates,
    fetchDetail: fetchSitePageDetail,
    mutations: {
      add: addSitePage,
      update: updateSitePage,
      delete: deleteSitePage,
    },
  },
  form: {
    schema: sitePageSchema,
    emptyValues: {
      slug: "",
      locale: "en",
      title: "",
      description: "",
      body: "",
    },
    layout: sitePageForm,
  },
  detail: {
    relations: [contentHistoryRelation<SitePage>("page")],
    tabs: [
      {
        type: "fields",
        value: "content",
        label: { en: "Content", ro: "Conținut" },
        formTab: "content",
      },
      {
        type: "fields",
        value: "info",
        label: { en: "Details", ro: "Detalii" },
        formTab: "info",
      },
      contentHistoryTab,
    ],
    formInTabs: true,
  },
  dataView: {
    overview: {
      dataTableColumns: sitePageColumns,
      dataListColumns: sitePageListColumns,
      features: { aggregates: false, grouping: false },
      defaultView: {
        table: {
          sorting: [{ column: "slug", desc: false }, { column: "locale", desc: false }],
        },
        list: {
          sorting: [{ column: "slug", desc: false }, { column: "locale", desc: false }],
        },
      },
    },
    pickup: {
      dataTableColumns: sitePagePickupColumns,
      features: { aggregates: false, grouping: false },
    },
  },
});

export const { hooks: sitePageHooks, components: sitePageComponents } = sitePagesResource;
export const {
  Overview: SitePageOverview,
  AddPage: SitePageAddPage,
  DetailPage: SitePageDetailPage,
} = sitePageComponents;
