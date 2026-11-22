"use client";

import { defineResource } from "@/framework/core/define-resource";
import { fetchGroupList, fetchGroupDetail, addGroup, updateGroup, deleteGroup, fetchGroupAggregates } from "./config/api";
import { groupColumns, groupListColumns, groupPickupColumns } from "./config/columns";
import { groupForm } from "./config/form";
import { groupsDescriptor } from "./config/descriptor";
import { groupSchema, type GroupFormValues } from "./config/schema";
import type { Group } from "./config/api";
import { groupRelations } from "./config/relations";

export const groupsResource = defineResource<
  Group,
  GroupFormValues,
  number
>({
  descriptor: groupsDescriptor,
  idField: "id",
  presentation: { open: "page", add: "dialog" },
  data: {
    fetchList: fetchGroupList,
    fetchAggregates: fetchGroupAggregates,
    fetchDetail: fetchGroupDetail,
    mutations: {
      add: addGroup,
      update: updateGroup,
      delete: deleteGroup,
    },
  },
  form: {
    schema: groupSchema,
    emptyValues: {
      name: "",
      description: "",
    },
    layout: groupForm,
  },
  detail: {
    relations: groupRelations,
    tabs: [
      {
        type: "relation",
        value: "permissions",
        label: { en: "Permissions", ro: "Permisiuni" },
        relationKey: "permissions",
      },
      {
        type: "relation",
        value: "users",
        label: { en: "Users", ro: "Utilizatori" },
        relationKey: "users",
      },
    ],
  },
  dataView: {
    overview: {
      dataTableColumns: groupColumns,
      dataListColumns: groupListColumns,
      features: { aggregates: false, grouping: false, edit: false },
    },
    pickup: {
      dataTableColumns: groupPickupColumns,
      features: { aggregates: false, grouping: false, edit: false },
    },
  },
});

export const { hooks: groupHooks, components: groupComponents } = groupsResource;
export const {
  Overview: GroupOverview,
  AddPage: GroupAddPage,
  DetailPage: GroupDetailPage,
} = groupComponents;
