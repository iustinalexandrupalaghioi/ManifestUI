"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchGroupPermissionList, fetchGroupPermissionDetail, addGroupPermission, updateGroupPermission, deleteGroupPermission, fetchGroupPermissionAggregates } from "./config/api";
import { groupPermissionColumns, groupPermissionListColumns, groupPermissionPickupColumns } from "./config/columns";
import { groupPermissionForm } from "./config/form";
import { groupPermissionsDescriptor } from "./config/descriptor";
import { groupPermissionSchema, type GroupPermissionFormValues } from "./config/schema";
import type { GroupPermission } from "./config/api";

export const groupPermissionsResource = defineResource<
  GroupPermission,
  GroupPermissionFormValues,
  number
>({
  descriptor: groupPermissionsDescriptor,
  idField: "id",
  presentation: { open: "split", add: "dialog", split: { onOpen: "open-first" } },
  data: {
    fetchList: fetchGroupPermissionList,
    fetchAggregates: fetchGroupPermissionAggregates,
    fetchDetail: fetchGroupPermissionDetail,
    mutations: {
      add: addGroupPermission,
      update: updateGroupPermission,
      delete: deleteGroupPermission,
    },
  },
  form: {
    schema: groupPermissionSchema,
    emptyValues: {
      groupId: 0,
      resourceId: "",
      canRead: false,
      canAdd: false,
      canUpdate: false,
      canDelete: false,
      allowed: false,
    },
    layout: groupPermissionForm,
  },
  detail: { },
  dataView: {
    overview: {
      dataTableColumns: groupPermissionColumns,
      dataListColumns: groupPermissionListColumns,
      features: { aggregates: false, grouping: false },
    },
    pickup: {
      dataTableColumns: groupPermissionPickupColumns,
      features: { aggregates: false, grouping: false, edit: false },
    },
  },
});

export const { hooks: groupPermissionHooks, components: groupPermissionComponents } = groupPermissionsResource;
export const {
  Overview: GroupPermissionOverview,
  AddPage: GroupPermissionAddPage,
  DetailPage: GroupPermissionDetailPage,
} = groupPermissionComponents;
