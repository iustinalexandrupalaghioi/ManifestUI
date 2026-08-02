"use client";
import { BUCKET } from "./config/constants";
import { defineResource } from "@/framework/core/define-resource";
import type { TodoAttachment } from "@/app/types/main/Attachment";
import { attachmentSchema, type AttachmentFormValues } from "./config/schema";
import {
  fetchAttachmentList,
  fetchAttachmentDetail,
  addAttachment,
  updateAttachment,
  deleteAttachments,
} from "./config/api";
import { attachmentsForm } from "./config/form";
import { attachmentColumns } from "./config/columns";

export const attachmentsResource = defineResource<
  TodoAttachment,
  AttachmentFormValues
>({
  id: "attachments",
  noun: "attachment",
  queryKey: ["attachments"],
  schema: attachmentSchema,

  routes: {
    list: "/attachments",
    add: "/attachments/add",
    detail: (id: string) => `/attachments/${id}`,
  },

  labels: {
    singular: "Attachment",
    plural: "Attachments",
    new: "Attachment",
  },

  openMode: "dialog",
  addMode: "dialog",

  emptyValues: {
    todo_id: 0,
    filename: "",
    path: "",
  },

  fetchList: fetchAttachmentList,
  fetchDetail: fetchAttachmentDetail,
  mutationFns: {
    add: addAttachment,
    update: updateAttachment,
    delete: deleteAttachments,
  },
  getRowUrl: (attachment) =>
    `${process.env.NEXT_PUBLIC_BASE_URL}/attachments/${attachment.id}`,

  columns: attachmentColumns,

  form: attachmentsForm,

  overviewKey: "attachments-overview",

  defaultViewName: "Attachments",
});

// ─── Named exports ───────────────────────────
export const { hooks: attachmentHooks, components: attachmentComponents } =
  attachmentsResource;

export const attachmentKeys = attachmentHooks.keys;
export const OVERVIEW_KEY = "attachments-overview";
export const useAttachmentsInfinite = attachmentHooks.useList;
export const useAttachment = attachmentHooks.useDetail;

export const {
  Overview: AttachmentOverview,
  AddDialog: AttachmentAddDialog,
  DetailDialog: AttachmentDetailDialog,
  AddPage: AttachmentAddPage,
  DetailPage: AttachmentDetailPage,
  LookupDialog: AttachmentLookupDialog,
} = attachmentComponents;

export const attachmentsConfig = { bucket: BUCKET };
