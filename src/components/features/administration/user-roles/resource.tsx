"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { UserRole } from "@/app/types/administration/UserRole";
import {
  fetchUserRoleDetail,
  fetchUserRoleList,
  addUserRole,
  updateUserRole,
  deleteUserRoles,
} from "./config/api";
import { userRolesForm } from "./config/form";
import { userRoleSchema, type UserRoleFormValues } from "./config/schema";
import { userRoleColumns } from "./config/columns";
import { userRolesDescriptor } from "./config/descriptor";

export const userRolesResource = defineResource<
  UserRole,
  UserRoleFormValues,
  string
>({
  id: userRolesDescriptor.id,
  noun: userRolesDescriptor.noun,
  queryKey: userRolesDescriptor.queryKey,
  schema: userRoleSchema,

  routes: userRolesDescriptor.routes,

  labels: userRolesDescriptor,

  openMode: "dialog",
  addMode: "dialog",

  emptyValues: {
    user_id: "",
    role_id: 0,
  },

  fetchList: fetchUserRoleList,
  fetchDetail: fetchUserRoleDetail,
  mutationFns: {
    add: addUserRole,
    update: updateUserRole,
    delete: deleteUserRoles,
  },

  columns: userRoleColumns,
  pickupColumns: userRoleColumns,

  form: userRolesForm,

  overviewKey: userRolesDescriptor.overviewKey,
  defaultViewName: userRolesDescriptor.defaultViewName,
});

export const { hooks: userRoleHooks, components: userRoleComponents } =
  userRolesResource;

export const userRoleKeys = userRoleHooks.keys;
export const OVERVIEW_KEY = userRolesDescriptor.overviewKey;
export const useUserRolesInfinite = userRoleHooks.useList;
export const useUserRole = userRoleHooks.useDetail;

export const {
  Overview: UserRoleOverview,
  AddDialog: UserRoleAddDialog,
  DetailDialog: UserRoleDetailDialog,
  AddPage: UserRoleAddPage,
  DetailPage: UserRoleDetailPage,
  LookupDialog: UserRoleLookupDialog,
} = userRoleComponents;
