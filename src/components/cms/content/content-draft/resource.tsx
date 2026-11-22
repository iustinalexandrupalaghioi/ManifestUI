"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchContentDraftList, fetchContentDraftDetail, addContentDraft, updateContentDraft, deleteContentDraft, fetchContentDraftAggregates } from "./config/api";
import { contentDraftColumns, contentDraftListColumns, contentDraftPickupColumns } from "./config/columns";
import { contentDraftForm } from "./config/form";
import { contentDraftsDescriptor } from "./config/descriptor";
import { contentDraftSchema, type ContentDraftFormValues } from "./config/schema";
import type { ContentDraft } from "./config/api";
import { useContentDraftActions } from "./config/actions";

export const contentDraftsResource = defineResource<
  ContentDraft,
  ContentDraftFormValues,
  number
>({
  descriptor: contentDraftsDescriptor,
  idField: "id",
  presentation: { open: "page", add: "page" },
  // Records aren't added or deleted in the CMS.
  add: false,
  delete: false,
  data: {
    fetchList: fetchContentDraftList,
    fetchAggregates: fetchContentDraftAggregates,
    fetchDetail: fetchContentDraftDetail,
    mutations: {
      add: addContentDraft,
      update: updateContentDraft,
      delete: deleteContentDraft,
    },
  },
  form: {
    schema: contentDraftSchema,
    emptyValues: {
      type: "",
      rowId: "",
      data: {},
    },
    layout: contentDraftForm,
  },
  // Toolbar buttons (descriptor.actions), each running its server action in ./config/actions.
  actions: { bulk: useContentDraftActions },
  dataView: {
    overview: {
      dataTableColumns: contentDraftColumns,
      dataListColumns: contentDraftListColumns,
      features: { aggregates: false, grouping: false },
      defaultView: {
        table: { sorting: [{ column: "updatedAt", desc: true }] },
        list: { sorting: [{ column: "updatedAt", desc: true }] },
      },
    },
    pickup: {
      dataTableColumns: contentDraftPickupColumns,
      features: { aggregates: false, grouping: false },
    },
  },
});

export const { hooks: contentDraftHooks, components: contentDraftComponents } = contentDraftsResource;
export const {
  Overview: ContentDraftOverview,
  AddPage: ContentDraftAddPage,
  DetailPage: ContentDraftDetailPage,
} = contentDraftComponents;
