"use client";

import { defineResource } from "@/framework/core/define-resource";
import { type Relation } from "@/app/types/main/Relation";
import {
  fetchRelationDetail,
  fetchRelationList,
  addRelation,
  updateRelation,
  deleteRelations,
} from "./config/api";
import { relationsAddTabs, relationsForm } from "./config/form";
import { relationsTabs } from "./config/tabs";
import { relationsRelations } from "./config/relations";
import { relationSchema, type RelationFormValues } from "./config/schema";
import { relationColumns } from "./config/columns";
import { relationsDetailSlots } from "./config/detailSlots";

export const relationsResource = defineResource<Relation, RelationFormValues>({
  id: "relations",
  noun: "relation",
  queryKey: ["relations"],
  schema: relationSchema,
  routes: {
    list: "/relations",
    add: "/relations/add",
    detail: (id: string) => `/relations/${id}`,
  },

  labels: {
    singular: "Relation",
    plural: "Relations",
    new: "Relation",
  },

  openMode: "page",
  addMode: "page",
  dialog: {
    className: "sm:max-w-full",
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
  fetchDetail: fetchRelationDetail,
  mutationFns: {
    add: addRelation,
    update: updateRelation,
    delete: deleteRelations,
  },
  getRowUrl: (relation) =>
    `${process.env.NEXT_PUBLIC_BASE_URL}/relations/${relation.id}`,

  columns: relationColumns,
  pickupColumns: relationColumns,

  form: relationsForm,
  tabs: relationsTabs,
  relations: relationsRelations,
  // detailSlots: relationsDetailSlots,
  addTabs: relationsAddTabs,
  defaultTab: "todos",
  defaultFormOpen: true,

  overviewKey: "relations-overview",
  defaultViewName: "Relations",
});

export const { hooks: relationHooks, components: relationComponents } =
  relationsResource;

export const relationKeys = relationHooks.keys;
export const OVERVIEW_KEY = "relations-overview";
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
