"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchContentRevisionList, fetchContentRevisionDetail, addContentRevision, updateContentRevision, deleteContentRevision, fetchContentRevisionAggregates } from "./config/api";
import { contentRevisionColumns, contentRevisionListColumns, contentRevisionPickupColumns } from "./config/columns";
import { contentRevisionForm } from "./config/form";
import { contentRevisionsDescriptor } from "./config/descriptor";
import { contentRevisionSchema, type ContentRevisionFormValues } from "./config/schema";
import type { ContentRevision } from "./config/api";
import { useContentRevisionActions } from "./config/actions";

export const contentRevisionsResource = defineResource<
  ContentRevision,
  ContentRevisionFormValues,
  number
>({
  descriptor: contentRevisionsDescriptor,
  idField: "id",
  presentation: { open: "page", add: "page" },
  // Records aren't added or deleted in the CMS.
  add: false,
  delete: false,
  data: {
    fetchList: fetchContentRevisionList,
    fetchAggregates: fetchContentRevisionAggregates,
    fetchDetail: fetchContentRevisionDetail,
    mutations: {
      add: addContentRevision,
      update: updateContentRevision,
      delete: deleteContentRevision,
    },
  },
  form: {
    schema: contentRevisionSchema,
    emptyValues: {
      type: "",
      rowId: "",
      data: {},
    },
    layout: contentRevisionForm,
  },
  detail: {
    slots: {
      afterForm: { type: "revisionCompare" },
    },
  },
  // Toolbar buttons (descriptor.actions), each running its server action in ./config/actions.
  actions: { bulk: useContentRevisionActions },
  dataView: {
    overview: {
      dataTableColumns: contentRevisionColumns,
      dataListColumns: contentRevisionListColumns,
      features: { aggregates: false, grouping: false },
      defaultView: {
        table: { sorting: [{ column: "publishedAt", desc: true }] },
        list: { sorting: [{ column: "publishedAt", desc: true }] },
      },
    },
    pickup: {
      dataTableColumns: contentRevisionPickupColumns,
      features: { aggregates: false, grouping: false },
    },
  },
});

export const { hooks: contentRevisionHooks, components: contentRevisionComponents } = contentRevisionsResource;
export const {
  Overview: ContentRevisionOverview,
  AddPage: ContentRevisionAddPage,
  DetailPage: ContentRevisionDetailPage,
} = contentRevisionComponents;
