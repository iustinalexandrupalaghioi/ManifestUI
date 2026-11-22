"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchServiceList, fetchServiceDetail, addService, updateService, deleteService, fetchServiceAggregates } from "./config/api";
import { serviceColumns, serviceListColumns, servicePickupColumns } from "./config/columns";
import { serviceForm } from "./config/form";
import { servicesDescriptor } from "./config/descriptor";
import { serviceSchema, type ServiceFormValues } from "./config/schema";
import type { Service } from "./config/api";
import { contentHistoryRelation, contentHistoryTab } from "@/components/cms/content/history";

export const servicesResource = defineResource<
  Service,
  ServiceFormValues,
  number
>({
  descriptor: servicesDescriptor,
  idField: "id",
  presentation: { open: "page", add: "page" },
  data: {
    fetchList: fetchServiceList,
    fetchAggregates: fetchServiceAggregates,
    fetchDetail: fetchServiceDetail,
    mutations: {
      add: addService,
      update: updateService,
      delete: deleteService,
    },
  },
  form: {
    schema: serviceSchema,
    emptyValues: {
      slug: "",
      locale: "en",
      position: 0,
      image: { src: "", width: 0, height: 0 },
      title: "",
      summary: "",
      body: "",
    },
    layout: serviceForm,
  },
  detail: {
    relations: [contentHistoryRelation<Service>("service")],
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
        label: { en: "SEO / Info", ro: "SEO / Informații" },
        formTab: "info",
      },
      contentHistoryTab,
    ],
    formInTabs: true,
  },
  dataView: {
    overview: {
      dataTableColumns: serviceColumns,
      dataListColumns: serviceListColumns,
      features: { aggregates: false, grouping: false },
      defaultView: {
        table: {
          sorting: [{ column: "locale", desc: false }, { column: "position", desc: false }],
        },
        list: {
          sorting: [{ column: "locale", desc: false }, { column: "position", desc: false }],
        },
      },
    },
    pickup: {
      dataTableColumns: servicePickupColumns,
      features: { aggregates: false, grouping: false },
    },
  },
});

export const { hooks: serviceHooks, components: serviceComponents } = servicesResource;
export const {
  Overview: ServiceOverview,
  AddPage: ServiceAddPage,
  DetailPage: ServiceDetailPage,
} = serviceComponents;
