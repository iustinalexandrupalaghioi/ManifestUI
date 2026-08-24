"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { Group } from "@/app/types/administration/Group";
import {
  fetchGroupDetail,
  fetchGroupList,
  fetchGroupAggregates,
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
  descriptor: groupsDescriptor,

  presentation: {
    open: "page",
    add: "dialog",
  },

  data: {
    fetchList: fetchGroupList,
    fetchAggregates: fetchGroupAggregates,
    fetchDetail: fetchGroupDetail,
    mutations: { add: addGroup, update: updateGroup, delete: deleteGroups },
  },

  form: {
    schema: groupSchema,
    emptyValues: {
      name: "",
      description: "",
    },
    layout: groupsForm,
  },

  detail: {
    tabs: groupsTabs,
    relations: groupsRelations,
  },

  dataView: {
    overview: {
      dataTableColumns: groupColumns,
      dataListColumns: groupListColumns,
      features: {
        edit: false,
      },
    },
    pickup: { dataTableColumns: groupColumns },
  },
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
  PickupDialog: GroupPickupDialog,
} = groupComponents;
