"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchUserGroupList, fetchUserGroupDetail, addUserGroup, updateUserGroup, deleteUserGroup, fetchUserGroupAggregates } from "./config/api";
import { userGroupColumns, userGroupListColumns, userGroupPickupColumns } from "./config/columns";
import { userGroupForm } from "./config/form";
import { userGroupsDescriptor } from "./config/descriptor";
import { userGroupSchema, type UserGroupFormValues } from "./config/schema";
import type { UserGroup } from "./config/api";

export const userGroupsResource = defineResource<
  UserGroup,
  UserGroupFormValues,
  string
>({
  descriptor: userGroupsDescriptor,
  idField: "id",
  presentation: { open: "dialog", add: "dialog" },
  data: {
    fetchList: fetchUserGroupList,
    fetchAggregates: fetchUserGroupAggregates,
    fetchDetail: fetchUserGroupDetail,
    mutations: {
      add: addUserGroup,
      update: updateUserGroup,
      delete: deleteUserGroup,
    },
  },
  form: {
    schema: userGroupSchema,
    emptyValues: {
      userId: "",
      groupId: 0,
    },
    layout: userGroupForm,
  },
  detail: { },
  dataView: {
    overview: {
      dataTableColumns: userGroupColumns,
      dataListColumns: userGroupListColumns,
      features: { aggregates: false, grouping: false, edit: false },
      defaultView: {
        table: { sorting: [{ column: "createdAt", desc: false }] },
        list: { sorting: [{ column: "createdAt", desc: false }] },
      },
    },
    pickup: {
      dataTableColumns: userGroupPickupColumns,
      features: { aggregates: false, grouping: false, edit: false },
    },
  },
});

export const { hooks: userGroupHooks, components: userGroupComponents } = userGroupsResource;
export const {
  Overview: UserGroupOverview,
  AddPage: UserGroupAddPage,
  DetailPage: UserGroupDetailPage,
} = userGroupComponents;
