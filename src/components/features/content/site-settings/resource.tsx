"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { siteSettings } from "@/db/schema";
import { parseSiteSettings } from "@/components/site/settings/model";
import starter from "@/db/seed/site-settings/en.json";
import {
  fetchSiteSettingsDetail,
  fetchSiteSettingsList,
  fetchSiteSettingsAggregates,
  addSiteSettings,
  updateSiteSettings,
  deleteSiteSettings,
} from "./config/api";
import { siteSettingsForm } from "./config/form";
import { siteSettingsSchema, type SiteSettingsFormValues } from "./config/schema";
import { siteSettingsColumns, siteSettingsListColumns } from "./config/columns";
import { siteSettingsDescriptor } from "./config/descriptor";

/** The site's header and footer, one record per language, edited on the canvas. */
export const siteSettingsResource = defineResource<typeof siteSettings.$inferSelect, SiteSettingsFormValues>({
  descriptor: siteSettingsDescriptor,

  presentation: {
    open: "page",
    add: "page",
  },

  data: {
    fetchList: fetchSiteSettingsList,
    fetchAggregates: fetchSiteSettingsAggregates,
    fetchDetail: fetchSiteSettingsDetail,
    mutations: { add: addSiteSettings, update: updateSiteSettings, delete: deleteSiteSettings },
  },

  form: {
    schema: siteSettingsSchema,
    // A new language starts from the English starter content, ready to translate.
    emptyValues: { locale: "ro", content: parseSiteSettings(starter) },
    layout: siteSettingsForm,
  },

  dataView: {
    overview: {
      dataTableColumns: siteSettingsColumns,
      dataListColumns: siteSettingsListColumns,
      features: { grouping: false, aggregates: false },
      defaultView: {
        table: { sorting: [{ column: "locale" }] },
        list: { sorting: [{ column: "locale" }] },
      },
    },
    pickup: {
      dataTableColumns: siteSettingsColumns,
      dataListColumns: siteSettingsListColumns,
      features: { grouping: false, aggregates: false },
    },
  },
});

export const { hooks: siteSettingsHooks, components: siteSettingsComponents } = siteSettingsResource;

export const {
  Overview: SiteSettingsOverview,
  AddPage: SiteSettingsAddPage,
  DetailPage: SiteSettingsDetailPage,
} = siteSettingsComponents;
