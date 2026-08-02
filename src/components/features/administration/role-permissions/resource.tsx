"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { RolePermission } from "@/app/types/administration/RolePermission";
import {
  fetchRolePermissionDetail,
  fetchRolePermissionList,
  addRolePermission,
  updateRolePermission,
  deleteRolePermissions,
} from "./config/api";
import { rolePermissionsForm } from "./config/form";
import {
  rolePermissionSchema,
  type RolePermissionFormValues,
} from "./config/schema";
import { rolePermissionColumns } from "./config/columns";

export const rolePermissionsResource = defineResource<
  RolePermission,
  RolePermissionFormValues
>({
  id: "role-permissions",
  noun: "role permission",
  queryKey: ["role-permissions"],
  schema: rolePermissionSchema,

  routes: {
    list: "/role-permissions",
    add: "/role-permissions/add",
    detail: (id: string) => `/role-permissions/${id}`,
  },

  labels: {
    singular: "Role permission",
    plural: "Role permissions",
    new: "Role permission",
  },

  openMode: "dialog",
  addMode: "dialog",

  emptyValues: {
    role_id: 0,
    resource_id: 0,
    can_read: false,
    can_add: false,
    can_update: false,
    can_delete: false,
    allowed: false,
  },

  fetchList: fetchRolePermissionList,
  fetchDetail: fetchRolePermissionDetail,
  mutationFns: {
    add: addRolePermission,
    update: updateRolePermission,
    delete: deleteRolePermissions,
  },

  columns: rolePermissionColumns,
  pickupColumns: rolePermissionColumns,
  form: rolePermissionsForm,

  overviewKey: "role-permissions-overview",
  defaultViewName: "Role permissions",
});

export const {
  hooks: rolePermissionHooks,
  components: rolePermissionComponents,
} = rolePermissionsResource;

export const rolePermissionKeys = rolePermissionHooks.keys;
export const OVERVIEW_KEY = "role-permissions-overview";
export const useRolePermissionsInfinite = rolePermissionHooks.useList;
export const useRolePermission = rolePermissionHooks.useDetail;

export const {
  Overview: RolePermissionOverview,
  AddDialog: RolePermissionAddDialog,
  DetailDialog: RolePermissionDetailDialog,
  AddPage: RolePermissionAddPage,
  DetailPage: RolePermissionDetailPage,
  LookupDialog: RolePermissionLookupDialog,
} = rolePermissionComponents;
