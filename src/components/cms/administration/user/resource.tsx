"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchUserList, fetchUserDetail, addUser, updateUser, deleteUser, fetchUserAggregates } from "./config/api";
import { userColumns, userListColumns, userPickupColumns } from "./config/columns";
import { userForm } from "./config/form";
import { usersDescriptor } from "./config/descriptor";
import { userSchema, type UserFormValues } from "./config/schema";
import type { User } from "./config/api";
import { userRelations } from "./config/relations";

export const usersResource = defineResource<
  User,
  UserFormValues,
  string
>({
  descriptor: usersDescriptor,
  idField: "id",
  presentation: { open: "page", add: "page" },
  // Records aren't added or deleted in the CMS.
  add: false,
  data: {
    fetchList: fetchUserList,
    fetchAggregates: fetchUserAggregates,
    fetchDetail: fetchUserDetail,
    mutations: {
      add: addUser,
      update: updateUser,
      delete: deleteUser,
    },
  },
  form: {
    schema: userSchema,
    emptyValues: {
      id: "",
      administrator: false,
    },
    layout: userForm,
  },
  detail: {
    relations: userRelations,
  },
  dataView: {
    overview: {
      dataTableColumns: userColumns,
      dataListColumns: userListColumns,
      features: { aggregates: false, grouping: false, edit: false },
      defaultView: {
        table: { sorting: [{ column: "createdAt", desc: false }] },
        list: { sorting: [{ column: "createdAt", desc: false }] },
      },
    },
    pickup: {
      dataTableColumns: userPickupColumns,
      features: { aggregates: false, grouping: false, edit: false },
    },
  },
});

export const { hooks: userHooks, components: userComponents } = usersResource;
export const {
  Overview: UserOverview,
  AddPage: UserAddPage,
  DetailPage: UserDetailPage,
} = userComponents;
