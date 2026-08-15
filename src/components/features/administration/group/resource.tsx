"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { Group } from "@/app/types/administration/Group";
import {
  fetchGroupDetail,
  fetchGroupList,
  addGroup,
  updateGroup,
  deleteGroups,
} from "./config/api";
import { groupsForm } from "./config/form";
import { groupSchema, type GroupFormValues } from "./config/schema";
import { groupColumns, groupListColumns } from "./config/columns";
import { groupsTabs } from "./config/tabs";
import { groupsRelations } from "./config/relations";
import { groupsDescriptor } from "./config/descriptor";

export const groupsResource = defineResource<Group, GroupFormValues>({
  id: groupsDescriptor.id,
  noun: groupsDescriptor.noun,
  queryKey: groupsDescriptor.queryKey,
  schema: groupSchema,

  routes: groupsDescriptor.routes,

  labels: groupsDescriptor,

  openMode: "page",
  addMode: "dialog",

  emptyValues: {
    name: "",
    description: "",
  },

  fetchList: fetchGroupList,
  fetchDetail: fetchGroupDetail,
  mutationFns: { add: addGroup, update: updateGroup, delete: deleteGroups },

  columns: groupColumns,
  listColumns: groupListColumns,
  pickupColumns: groupColumns,
  form: groupsForm,
  tabs: groupsTabs,
  relations: groupsRelations,

  overviewKey: groupsDescriptor.overviewKey,
  defaultViewName: groupsDescriptor.defaultViewName,
});

export const { hooks: groupHooks, components: groupComponents } = groupsResource;

export const groupKeys = groupHooks.keys;
export const OVERVIEW_KEY = groupsDescriptor.overviewKey;
export const useGroupsInfinite = groupHooks.useList;
export const useGroup = groupHooks.useDetail;

export const {
  Overview: GroupOverview,
  AddDialog: GroupAddDialog,
  DetailDialog: GroupDetailDialog,
  AddPage: GroupAddPage,
  DetailPage: GroupDetailPage,
  LookupDialog: GroupLookupDialog,
} = groupComponents;
