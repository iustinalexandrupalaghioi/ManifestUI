"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { UserGroup } from "@/app/types/administration/UserGroup";
import {
  fetchUserGroupDetail,
  fetchUserGroupList,
  addUserGroup,
  updateUserGroup,
  deleteUserGroups,
} from "./config/api";
import { userGroupsForm } from "./config/form";
import { userGroupSchema, type UserGroupFormValues } from "./config/schema";
import { userGroupColumns } from "./config/columns";
import { userGroupsDescriptor } from "./config/descriptor";

export const userGroupsResource = defineResource<
  UserGroup,
  UserGroupFormValues,
  string
>({
  id: userGroupsDescriptor.id,
  noun: userGroupsDescriptor.noun,
  queryKey: userGroupsDescriptor.queryKey,
  schema: userGroupSchema,

  routes: userGroupsDescriptor.routes,

  labels: userGroupsDescriptor,

  openMode: "dialog",
  addMode: "dialog",

  emptyValues: {
    user_id: "",
    group_id: 0,
  },

  fetchList: fetchUserGroupList,
  fetchDetail: fetchUserGroupDetail,
  mutationFns: {
    add: addUserGroup,
    update: updateUserGroup,
    delete: deleteUserGroups,
  },

  columns: userGroupColumns,
  pickupColumns: userGroupColumns,

  form: userGroupsForm,

  overviewKey: userGroupsDescriptor.overviewKey,
  defaultViewName: userGroupsDescriptor.defaultViewName,
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
  LookupDialog: UserGroupLookupDialog,
} = userGroupComponents;
