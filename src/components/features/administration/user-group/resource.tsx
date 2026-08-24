"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { UserGroup } from "@/app/types/administration/UserGroup";
import {
  fetchUserGroupDetail,
  fetchUserGroupList,
  fetchUserGroupAggregates,
  addUserGroup,
  updateUserGroup,
  deleteUserGroups,
} from "./config/api";
import { userGroupsForm } from "./config/form";
import { userGroupSchema, type UserGroupFormValues } from "./config/schema";
import { userGroupColumns, userGroupListColumns } from "./config/columns";
import { userGroupsDescriptor } from "./config/descriptor";

export const userGroupsResource = defineResource<
  UserGroup,
  UserGroupFormValues,
  string
>({
  descriptor: userGroupsDescriptor,

  presentation: {
    open: "dialog",
    add: "dialog",
  },

  data: {
    fetchList: fetchUserGroupList,
    fetchAggregates: fetchUserGroupAggregates,
    fetchDetail: fetchUserGroupDetail,
    mutations: {
      add: addUserGroup,
      update: updateUserGroup,
      delete: deleteUserGroups,
    },
  },

  form: {
    schema: userGroupSchema,
    emptyValues: {
      user_id: "",
      group_id: 0,
    },
    layout: userGroupsForm,
  },

  dataView: {
    overview: {
      dataTableColumns: userGroupColumns,
      dataListColumns: userGroupListColumns,
      features: {
        edit: false,
      },
    },
    pickup: { dataTableColumns: userGroupColumns },
  },
});

export const { hooks: userGroupHooks, components: userGroupComponents } =
  userGroupsResource;

export const userGroupKeys = userGroupHooks.keys;
export const OVERVIEW_KEY = userGroupsDescriptor.overviewKey;
export const useUserGroupsInfinite = userGroupHooks.useList;
export const useUserGroup = userGroupHooks.useDetail;

export const {
  Overview: UserGroupOverview,
  AddDialog: UserGroupAddDialog,
  DetailDialog: UserGroupDetailDialog,
  AddPage: UserGroupAddPage,
  DetailPage: UserGroupDetailPage,
  PickupDialog: UserGroupPickupDialog,
} = userGroupComponents;
