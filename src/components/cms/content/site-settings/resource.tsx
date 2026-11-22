"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchSiteSettingsList, fetchSiteSettingsDetail, addSiteSettings, updateSiteSettings, deleteSiteSettings, fetchSiteSettingsAggregates } from "./config/api";
import { siteSettingsColumns, siteSettingsListColumns, siteSettingsPickupColumns } from "./config/columns";
import { siteSettingsForm } from "./config/form";
import { siteSettingsDescriptor } from "./config/descriptor";
import { siteSettingsSchema, type SiteSettingsFormValues } from "./config/schema";
import type { SiteSettings } from "./config/api";
import { contentHistoryRelation, contentHistoryTab } from "@/components/cms/content/history";

export const siteSettingsResource = defineResource<
  SiteSettings,
  SiteSettingsFormValues,
  number
>({
  descriptor: siteSettingsDescriptor,
  idField: "id",
  presentation: { open: "page", add: "page" },
  // A single entry: one row per language, never added or deleted here.
  add: false,
  delete: false,
  data: {
    fetchList: fetchSiteSettingsList,
    fetchAggregates: fetchSiteSettingsAggregates,
    fetchDetail: fetchSiteSettingsDetail,
    mutations: {
      add: addSiteSettings,
      update: updateSiteSettings,
      delete: deleteSiteSettings,
    },
  },
  form: {
    schema: siteSettingsSchema,
    emptyValues: {
      locale: "en",
    },
    layout: siteSettingsForm,
  },
  detail: {
    relations: [contentHistoryRelation<SiteSettings>("navigation")],
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
      dataTableColumns: siteSettingsColumns,
      dataListColumns: siteSettingsListColumns,
      features: { aggregates: false, grouping: false },
      defaultView: {
        table: { sorting: [{ column: "locale", desc: false }] },
        list: { sorting: [{ column: "locale", desc: false }] },
      },
    },
    pickup: {
      dataTableColumns: siteSettingsPickupColumns,
      features: { aggregates: false, grouping: false },
    },
  },
});

export const { hooks: siteSettingsHooks, components: siteSettingsComponents } = siteSettingsResource;
export const {
  Overview: SiteSettingsOverview,
  AddPage: SiteSettingsAddPage,
  DetailPage: SiteSettingsDetailPage,
} = siteSettingsComponents;
