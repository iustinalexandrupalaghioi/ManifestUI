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
import { attachmentColumns, attachmentListColumns } from "./config/columns";
import { attachmentsDescriptor } from "./config/descriptor";

export const attachmentsResource = defineResource<
  TodoAttachment,
  AttachmentFormValues
>({
  id: attachmentsDescriptor.id,
  noun: attachmentsDescriptor.noun,
  queryKey: attachmentsDescriptor.queryKey,
  schema: attachmentSchema,

  routes: attachmentsDescriptor.routes,

  labels: attachmentsDescriptor,

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
  columns: attachmentColumns,
  listColumns: attachmentListColumns,

  form: attachmentsForm,

  overviewKey: attachmentsDescriptor.overviewKey,

  defaultViewName: attachmentsDescriptor.defaultViewName,
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
  LookupDialog: AttachmentLookupDialog,
} = attachmentComponents;

export const attachmentsConfig = { bucket: BUCKET };
