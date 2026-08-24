"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { GroupPermission } from "@/app/types/administration/GroupPermission";
import {
  fetchGroupPermissionDetail,
  fetchGroupPermissionList,
  fetchGroupPermissionAggregates,
  addGroupPermission,
  updateGroupPermission,
  deleteGroupPermissions,
} from "./config/api";
import { groupPermissionsForm } from "./config/form";
import {
  groupPermissionSchema,
  type GroupPermissionFormValues,
} from "./config/schema";
import {
  groupPermissionColumns,
  groupPermissionListColumns,
} from "./config/columns";
import { groupPermissionsDescriptor } from "./config/descriptor";

export const groupPermissionsResource = defineResource<
  GroupPermission,
  GroupPermissionFormValues
>({
  descriptor: groupPermissionsDescriptor,

  presentation: {
    open: "split",
    split: { onOpen: "open-first", defaultWidth: 50 },
    add: "dialog",
  },

  data: {
    fetchList: fetchGroupPermissionList,
    fetchAggregates: fetchGroupPermissionAggregates,
    fetchDetail: fetchGroupPermissionDetail,
    mutations: {
      add: addGroupPermission,
      update: updateGroupPermission,
      delete: deleteGroupPermissions,
    },
  },

  form: {
    schema: groupPermissionSchema,
    emptyValues: {
      group_id: 0,
      resource_id: "",
      can_read: false,
      can_add: false,
      can_update: false,
      can_delete: false,
      allowed: false,
    },
    layout: groupPermissionsForm,
  },

  dataView: {
    overview: {
      dataTableColumns: groupPermissionColumns,
      dataListColumns: groupPermissionListColumns,
    },
    pickup: { dataTableColumns: groupPermissionColumns },
  },
});

export const {
  hooks: groupPermissionHooks,
  components: groupPermissionComponents,
} = groupPermissionsResource;

export const groupPermissionKeys = groupPermissionHooks.keys;
export const OVERVIEW_KEY = groupPermissionsDescriptor.overviewKey;
export const useGroupPermissionsInfinite = groupPermissionHooks.useList;
export const useGroupPermission = groupPermissionHooks.useDetail;

export const {
  Overview: GroupPermissionOverview,
  AddDialog: GroupPermissionAddDialog,
  DetailDialog: GroupPermissionDetailDialog,
  AddPage: GroupPermissionAddPage,
  DetailPage: GroupPermissionDetailPage,
  PickupDialog: GroupPermissionPickupDialog,
} = groupPermissionComponents;
