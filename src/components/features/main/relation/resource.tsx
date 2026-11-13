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
import { relationsDescriptor } from "./config/descriptor";

export const relationsResource = defineResource<Relation, RelationFormValues>({
  descriptor: relationsDescriptor,

  presentation: {
    open: "split",
    split: { onOpen: "open-all" },
    add: "page",
    dialog: { className: "sm:max-w-full" },
  },

  data: {
    fetchList: fetchRelationList,
    fetchAggregates: fetchRelationAggregates,
    fetchDetail: fetchRelationDetail,
    mutations: {
      add: addRelation,
      update: updateRelation,
      delete: deleteRelations,
    },
  },

  form: {
    schema: relationSchema,
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
    layout: relationsForm,
    addTabs: relationsAddTabs,
  },

  detail: {
    tabs: relationsTabs,
    relations: relationsRelations,
    // slots: relationsDetailSlots,
    defaultTab: "todos",
    defaultFormOpen: true,
  },

  dataView: {
    overview: {
      dataTableColumns: relationColumns,
      dataListColumns: relationListColumns,
      features: {
        edit: false,
        quickSearch: false,
        selection: false,
      },
    },
    pickup: { dataTableColumns: relationColumns },
  },

  open: false,
  delete: { toolbar: false },
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
  PickupDialog: RelationPickupDialog,
} = relationComponents;
