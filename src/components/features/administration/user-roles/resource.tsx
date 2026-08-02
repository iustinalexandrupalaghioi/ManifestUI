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

export const userRolesResource = defineResource<
  UserRole,
  UserRoleFormValues,
  string
>({
  id: "user-roles",
  noun: "user role",
  queryKey: ["user-roles"],
  schema: userRoleSchema,

  routes: {
    list: "/user-roles",
    add: "/user-roles/add",
    detail: (id: string) => `/user-roles/${id}`,
  },

  labels: {
    singular: "User role",
    plural: "User roles",
    new: "User role",
  },

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

  overviewKey: "user-roles-overview",
  defaultViewName: "User roles",
});

export const { hooks: userRoleHooks, components: userRoleComponents } =
  userRolesResource;

export const userRoleKeys = userRoleHooks.keys;
export const OVERVIEW_KEY = "user-roles-overview";
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
