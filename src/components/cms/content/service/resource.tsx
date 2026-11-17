"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { service } from "@/db/schema";
import { fetchServiceDetail, fetchServiceList, fetchServiceAggregates, addService, updateService, deleteServices } from "./config/api";
import { servicesForm } from "./config/form";
import { serviceSchema, type ServiceFormValues } from "./config/schema";
import { serviceColumns, serviceListColumns } from "./config/columns";
import { servicesDescriptor } from "./config/descriptor";

/** Services shown on the website through the "services" collection (one row per language). */
export const servicesResource = defineResource<typeof service.$inferSelect, ServiceFormValues>({
  descriptor: servicesDescriptor,

  presentation: {
    open: "page",
    add: "page",
  },

  data: {
    fetchList: fetchServiceList,
    fetchAggregates: fetchServiceAggregates,
    fetchDetail: fetchServiceDetail,
    mutations: { add: addService, update: updateService, delete: deleteServices },
  },

  form: {
    schema: serviceSchema,
    emptyValues: {
      title: "",
      slug: "",
      locale: "en",
      summary: "",
      body: "",
      image: { src: "", width: 0, height: 0 },
      position: 0,
      published: false,
    },
    layout: servicesForm,
  },

  dataView: {
    overview: {
      dataTableColumns: serviceColumns,
      dataListColumns: serviceListColumns,
      features: { grouping: false, aggregates: false },
      defaultView: {
        table: { sorting: [{ column: "locale" }, { column: "position" }] },
        list: { sorting: [{ column: "locale" }, { column: "position" }] },
      },
    },
    pickup: {
      dataTableColumns: serviceColumns,
      dataListColumns: serviceListColumns,
      features: { grouping: false, aggregates: false },
    },
  },
});

export const { hooks: serviceHooks, components: serviceComponents } = servicesResource;

export const { Overview: ServiceOverview, AddPage: ServiceAddPage, DetailPage: ServiceDetailPage } = serviceComponents;
