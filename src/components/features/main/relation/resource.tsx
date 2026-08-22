"use client";

import { defineResource } from "@/framework/core/define-resource";
import { type Relation } from "@/app/types/main/Relation";
import {
  fetchRelationDetail,
  fetchRelationList,
  fetchRelationAggregates,
  addRelation,
  updateRelation,
  deleteRelations,
} from "./config/api";
import { relationsAddTabs, relationsForm } from "./config/form";
import { relationsTabs } from "./config/tabs";
import { relationsRelations } from "./config/relations";
import { relationSchema, type RelationFormValues } from "./config/schema";
import { relationColumns, relationListColumns } from "./config/columns";
import { relationsDetailSlots } from "./config/detailSlots";
import { relationsDescriptor } from "./config/descriptor";
import { truncate } from "fs/promises";

export const relationsResource = defineResource<Relation, RelationFormValues>({
  id: relationsDescriptor.id,
  noun: relationsDescriptor.noun,
  queryKey: relationsDescriptor.queryKey,
  schema: relationSchema,
  routes: relationsDescriptor.routes,

  labels: relationsDescriptor,

  openMode: "split",
  splitConfig: {
    onOpen: "none",
  },
  addMode: "page",
  dialog: {
    className: "sm:max-w-full",
  },

  dataView: {
    features: {
      views: true,
      sorting: true,
      selection: true,
      filtering: true,
      aggregates: true,
      grouping: true,
      editing: false,
      list: true,
      resizing: true,
      pinning: true,
      columnManager: true,
      quickSearch: false,
      viewModeToggle: true,
      open: false,
    },
  },
  emptyValues: {
    first_name: "",
    last_name: "",
    maiden_name: "",
    age: 0,
    gender: "male",
    email: "",
    phone: "",
    username: "",
    birth_date: "",
    image: "",
    blood_group: "",
    height: 0,
    weight: 0,
    eye_color: "",
    hair_color: "",
    hair_type: "",
  },

  fetchList: fetchRelationList,
  fetchAggregates: fetchRelationAggregates,
  fetchDetail: fetchRelationDetail,
  mutationFns: {
    add: addRelation,
    update: updateRelation,
    delete: deleteRelations,
  },
  columns: relationColumns,
  listColumns: relationListColumns,
  pickupColumns: relationColumns,

  form: relationsForm,
  tabs: relationsTabs,
  relations: relationsRelations,
  // detailSlots: relationsDetailSlots,
  addTabs: relationsAddTabs,
  defaultTab: "todos",
  defaultFormOpen: true,

  overviewKey: relationsDescriptor.overviewKey,
  defaultViewName: relationsDescriptor.defaultViewName,
});

export const { hooks: relationHooks, components: relationComponents } =
  relationsResource;

export const relationKeys = relationHooks.keys;
export const OVERVIEW_KEY = relationsDescriptor.overviewKey;
export const useRelationsInfinite = relationHooks.useList;
export const useRelation = relationHooks.useDetail;

export const {
  Overview: RelationOverview,
  AddDialog: RelationAddDialog,
  DetailDialog: RelationDetailDialog,
  AddPage: RelationAddPage,
  DetailPage: RelationDetailPage,
  LookupDialog: RelationLookupDialog,
} = relationComponents;
