"use client";
import { BUCKET } from "./config/constants";
import { defineResource } from "@/framework/core/define-resource";
import type { TodoAttachment } from "@/app/types/main/Attachment";
import { attachmentSchema, type AttachmentFormValues } from "./config/schema";
import {
  fetchAttachmentList,
  fetchAttachmentAggregates,
  fetchAttachmentDetail,
  addAttachment,
  updateAttachment,
  deleteAttachments,
} from "./config/api";
import { attachmentsForm } from "./config/form";
import { attachmentColumns, attachmentListColumns } from "./config/columns";
import { attachmentsDescriptor } from "./config/descriptor";

export const attachmentsResource = defineResource<
  TodoAttachment,
  AttachmentFormValues
>({
  descriptor: attachmentsDescriptor,

  presentation: {
    open: "dialog",
    add: "dialog",
  },

  data: {
    fetchList: fetchAttachmentList,
    fetchAggregates: fetchAttachmentAggregates,
    fetchDetail: fetchAttachmentDetail,
    mutations: {
      add: addAttachment,
      update: updateAttachment,
      delete: deleteAttachments,
    },
  },

  form: {
    schema: attachmentSchema,
    emptyValues: {
      todo_id: 0,
      filename: "",
      path: "",
    },
    layout: attachmentsForm,
  },

  dataView: {
    overview: {
      dataTableColumns: attachmentColumns,
      dataListColumns: attachmentListColumns,
    },
    pickup: { dataTableColumns: attachmentColumns },
  },
});

// ─── Named exports ───────────────────────────
export const { hooks: attachmentHooks, components: attachmentComponents } =
  attachmentsResource;

export const attachmentKeys = attachmentHooks.keys;
export const OVERVIEW_KEY = attachmentsDescriptor.overviewKey;
export const useAttachmentsInfinite = attachmentHooks.useList;
export const useAttachment = attachmentHooks.useDetail;

export const {
  Overview: AttachmentOverview,
  AddDialog: AttachmentAddDialog,
  DetailDialog: AttachmentDetailDialog,
  AddPage: AttachmentAddPage,
  DetailPage: AttachmentDetailPage,
  PickupDialog: AttachmentPickupDialog,
} = attachmentComponents;

export const attachmentsConfig = { bucket: BUCKET };
