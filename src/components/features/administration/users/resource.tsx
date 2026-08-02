"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { User } from "@/app/types/administration/User";
import {
  fetchUserDetail,
  fetchUserList,
  addUser,
  updateUser,
  deleteUsers,
} from "./config/api";
import { usersForm } from "./config/form";
import { userSchema, type UserFormValues } from "./config/schema";
import { userColumns } from "./config/columns";
import { userTabs } from "./config/tabs";
import { usersRelations } from "./config/relations";

// Mirrors Supabase auth.users, kept in sync via
// src/app/api/webhooks/auth-users/route.ts. No add/page.tsx route exists —
// rows are only ever created by that webhook, never manually — so `add` is
// unreachable through the UI even though defineResource always generates
// an AddPage component for it.
export const usersResource = defineResource<User, UserFormValues, string>({
  id: "users",
  noun: "user",
  queryKey: ["users"],
  schema: userSchema,

  routes: {
    list: "/users",
    add: "/users/add",
    detail: (id: string) => `/users/${id}`,
  },

  labels: {
    singular: "User",
    plural: "Users",
    new: "User",
  },

  openMode: "page",
  addMode: "page",

  emptyValues: {
    administrator: false,
  },

  fetchList: fetchUserList,
  fetchDetail: fetchUserDetail,
  mutationFns: { add: addUser, update: updateUser, delete: deleteUsers },

  columns: userColumns,
  pickupColumns: userColumns,

  form: usersForm,
  tabs: userTabs,
  relations: usersRelations,
  overviewKey: "users-overview",
  defaultViewName: "Users",
});

export const { hooks: userHooks, components: userComponents } = usersResource;

export const userKeys = userHooks.keys;
export const OVERVIEW_KEY = "users-overview";
export const useUsersInfinite = userHooks.useList;
export const useUser = userHooks.useDetail;

export const {
  Overview: UserOverview,
  AddDialog: UserAddDialog,
  DetailDialog: UserDetailDialog,
  AddPage: UserAddPage,
  DetailPage: UserDetailPage,
  LookupDialog: UserLookupDialog,
} = userComponents;
