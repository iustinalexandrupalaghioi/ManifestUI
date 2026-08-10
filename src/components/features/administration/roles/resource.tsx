"use client";

import { defineResource } from "@/framework/core/define-resource";
import type { Role } from "@/app/types/administration/Role";
import {
  fetchRoleDetail,
  fetchRoleList,
  addRole,
  updateRole,
  deleteRoles,
} from "./config/api";
import { rolesForm } from "./config/form";
import { roleSchema, type RoleFormValues } from "./config/schema";
import { roleColumns } from "./config/columns";
import { rolesTabs } from "./config/tabs";
import { rolesRelations } from "./config/relations";
import { rolesDescriptor } from "./config/descriptor";

export const rolesResource = defineResource<Role, RoleFormValues>({
  id: rolesDescriptor.id,
  noun: rolesDescriptor.noun,
  queryKey: rolesDescriptor.queryKey,
  schema: roleSchema,

  routes: rolesDescriptor.routes,

  labels: rolesDescriptor,

  openMode: "page",
  addMode: "dialog",

  emptyValues: {
    name: "",
    description: "",
  },

  fetchList: fetchRoleList,
  fetchDetail: fetchRoleDetail,
  mutationFns: { add: addRole, update: updateRole, delete: deleteRoles },
  getRowUrl: (role) => `${process.env.NEXT_PUBLIC_BASE_URL}/roles/${role.id}`,

  columns: roleColumns,
  pickupColumns: roleColumns,
  form: rolesForm,
  tabs: rolesTabs,
  relations: rolesRelations,

  overviewKey: rolesDescriptor.overviewKey,
  defaultViewName: rolesDescriptor.defaultViewName,
});

export const { hooks: roleHooks, components: roleComponents } = rolesResource;

export const roleKeys = roleHooks.keys;
export const OVERVIEW_KEY = rolesDescriptor.overviewKey;
export const useRolesInfinite = roleHooks.useList;
export const useRole = roleHooks.useDetail;

export const {
  Overview: RoleOverview,
  AddDialog: RoleAddDialog,
  DetailDialog: RoleDetailDialog,
  AddPage: RoleAddPage,
  DetailPage: RoleDetailPage,
  LookupDialog: RoleLookupDialog,
} = roleComponents;
