"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { User } from "@/app/types/administration/User";
import {
  fetchUserDetail,
  fetchUserList,
  fetchUserAggregates,
  addUser,
  updateUser,
  deleteUsers,
} from "./config/api";
import { usersForm } from "./config/form";
import { userSchema, type UserFormValues } from "./config/schema";
import { userColumns, userListColumns } from "./config/columns";
import { userTabs } from "./config/tabs";
import { usersRelations } from "./config/relations";
import { usersDescriptor } from "./config/descriptor";

export const usersResource = defineResource<User, UserFormValues, string>({
  descriptor: usersDescriptor,

  presentation: {
    open: "page",
    add: "page",
  },

  data: {
    fetchList: fetchUserList,
    fetchAggregates: fetchUserAggregates,
    fetchDetail: fetchUserDetail,
    mutations: { add: addUser, update: updateUser, delete: deleteUsers },
  },

  form: {
    schema: userSchema,
    emptyValues: {
      administrator: false,
    },
    layout: usersForm,
  },

  detail: {
    tabs: userTabs,
    relations: usersRelations,
  },

  dataView: {
    overview: {
      dataTableColumns: userColumns,
      dataListColumns: userListColumns,
      features: {
        edit: true,
      },
    },
    pickup: { dataTableColumns: userColumns },
  },
});

export const { hooks: userHooks, components: userComponents } = usersResource;

export const userKeys = userHooks.keys;
export const OVERVIEW_KEY = usersDescriptor.overviewKey;
export const useUsersInfinite = userHooks.useList;
export const useUser = userHooks.useDetail;

export const {
  Overview: UserOverview,
  AddDialog: UserAddDialog,
  DetailDialog: UserDetailDialog,
  AddPage: UserAddPage,
  DetailPage: UserDetailPage,
  PickupDialog: UserPickupDialog,
} = userComponents;
