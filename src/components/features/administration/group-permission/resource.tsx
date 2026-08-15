"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { GroupPermission } from "@/app/types/administration/GroupPermission";
import {
  fetchGroupPermissionDetail,
  fetchGroupPermissionList,
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
  id: groupPermissionsDescriptor.id,
  noun: groupPermissionsDescriptor.noun,
  queryKey: groupPermissionsDescriptor.queryKey,
  schema: groupPermissionSchema,

  routes: groupPermissionsDescriptor.routes,

  labels: groupPermissionsDescriptor,

  openMode: "dialog",
  addMode: "dialog",

  emptyValues: {
    group_id: 0,
    resource_id: "",
    can_read: false,
    can_add: false,
    can_update: false,
    can_delete: false,
    allowed: false,
  },

  fetchList: fetchGroupPermissionList,
  fetchDetail: fetchGroupPermissionDetail,
  mutationFns: {
    add: addGroupPermission,
    update: updateGroupPermission,
    delete: deleteGroupPermissions,
  },

  columns: groupPermissionColumns,
  listColumns: groupPermissionListColumns,
  pickupColumns: groupPermissionColumns,
  form: groupPermissionsForm,

  overviewKey: groupPermissionsDescriptor.overviewKey,
  defaultViewName: groupPermissionsDescriptor.defaultViewName,
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
  LookupDialog: GroupPermissionLookupDialog,
} = groupPermissionComponents;
