"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { Resource } from "@/app/types/administration/Resource";
import {
  fetchResourceDetail,
  fetchResourceList,
  addResource,
  updateResource,
  deleteResources,
} from "./config/api";
import { resourcesAddForm, resourcesForm } from "./config/form";
import { resourceSchema, type ResourceFormValues } from "./config/schema";
import { resourceColumns } from "./config/columns";

// Grantable units for role_resource_permissions — see
// src/db/schema/resources.ts for the "resource" vs "action" type split.
export const resourcesResource = defineResource<Resource, ResourceFormValues>({
  id: "resources",
  noun: "resource",
  queryKey: ["resources"],
  schema: resourceSchema,

  routes: {
    list: "/resources",
    add: "/resources/add",
    detail: (id: string) => `/resources/${id}`,
  },

  labels: {
    singular: "Resource",
    plural: "Resources",
    new: "Resource",
  },

  openMode: "dialog",
  addMode: "dialog",

  emptyValues: {
    name: "",
    type: "resource",
    label: "",
    description: "",
  },

  fetchList: fetchResourceList,
  fetchDetail: fetchResourceDetail,
  mutationFns: {
    add: addResource,
    update: updateResource,
    delete: deleteResources,
  },
  getRowUrl: (resource) =>
    `${process.env.NEXT_PUBLIC_BASE_URL}/resources/${resource.id}`,

  columns: resourceColumns,
  pickupColumns: resourceColumns,
  form: resourcesForm,
  addForm: resourcesAddForm,

  overviewKey: "resources-overview",
  defaultViewName: "Resources",
});

export const { hooks: resourceHooks, components: resourceComponents } =
  resourcesResource;

export const resourceKeys = resourceHooks.keys;
export const OVERVIEW_KEY = "resources-overview";
export const useResourcesInfinite = resourceHooks.useList;
export const useResource = resourceHooks.useDetail;

export const {
  Overview: ResourceOverview,
  AddDialog: ResourceAddDialog,
  DetailDialog: ResourceDetailDialog,
  AddPage: ResourceAddPage,
  DetailPage: ResourceDetailPage,
  LookupDialog: ResourceLookupDialog,
} = resourceComponents;
