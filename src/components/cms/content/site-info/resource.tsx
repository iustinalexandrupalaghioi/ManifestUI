"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchSiteInfoList, fetchSiteInfoDetail, addSiteInfo, updateSiteInfo, deleteSiteInfo, fetchSiteInfoAggregates } from "./config/api";
import { siteInfoColumns, siteInfoListColumns, siteInfoPickupColumns } from "./config/columns";
import { siteInfoForm } from "./config/form";
import { siteInfoDescriptor } from "./config/descriptor";
import { siteInfoSchema, type SiteInfoFormValues } from "./config/schema";
import type { SiteInfo } from "./config/api";
import { contentHistoryRelation, contentHistoryTab } from "@/components/cms/content/history";

export const siteInfoResource = defineResource<
  SiteInfo,
  SiteInfoFormValues,
  number
>({
  descriptor: siteInfoDescriptor,
  idField: "id",
  presentation: { open: "page", add: "page" },
  // A single entry: one row per language, never added or deleted here.
  add: false,
  delete: false,
  data: {
    fetchList: fetchSiteInfoList,
    fetchAggregates: fetchSiteInfoAggregates,
    fetchDetail: fetchSiteInfoDetail,
    mutations: {
      add: addSiteInfo,
      update: updateSiteInfo,
      delete: deleteSiteInfo,
    },
  },
  form: {
    schema: siteInfoSchema,
    emptyValues: {
      locale: "en",
      siteName: "",
      description: "",
    },
    layout: siteInfoForm,
  },
  detail: {
    relations: [contentHistoryRelation<SiteInfo>("siteInfo")],
    tabs: [
      {
        type: "fields",
        value: "details",
        label: { en: "Details", ro: "Detalii" },
      },
      contentHistoryTab,
    ],
    formInTabs: true,
  },
  dataView: {
    overview: {
      dataTableColumns: siteInfoColumns,
      dataListColumns: siteInfoListColumns,
      features: { aggregates: false, grouping: false },
      defaultView: {
        table: { sorting: [{ column: "locale", desc: false }] },
        list: { sorting: [{ column: "locale", desc: false }] },
      },
    },
    pickup: {
      dataTableColumns: siteInfoPickupColumns,
      features: { aggregates: false, grouping: false },
    },
  },
});

export const { hooks: siteInfoHooks, components: siteInfoComponents } = siteInfoResource;
export const {
  Overview: SiteInfoOverview,
  AddPage: SiteInfoAddPage,
  DetailPage: SiteInfoDetailPage,
} = siteInfoComponents;
