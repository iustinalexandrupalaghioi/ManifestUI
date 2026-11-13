import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { describeGrantResource, isGrantableAction } from "@/app/[locale]/cms/grantablePermissions";

export const groupPermissionColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", size: 70 },
  // Not shown — exists only so the groups→permissions relation tab can
  // pre-filter by it (see src/components/features/administration/group/config/relations.ts).
  {
    field: "groupId",
    label: { en: "Group Id", ro: "Id grup" },
    type: "number",
    hidden: true,
  },
  {
    field: "groupName",
    label: { en: "Group", ro: "Grup" },
    type: "text",
    size: 160,
    columnName: "name",
    origin: "group",
    hidden: true,
    accessorFn: (row) => row.group?.name,
  },
  {
    field: "resourceLabel",
    label: { en: "Resource", ro: "Resursă" },
    type: "text",
    size: 200,
    accessorFn: (row, locale) => describeGrantResource(row.resourceId, locale),
    // Editing this column edits the underlying resource_id combobox field,
    // not the derived "resource_label" — which isn't a real form field.
    editingField: "resource_id",
  },
  {
    field: "resourceType",
    label: { en: "Type", ro: "Tip" },
    type: "text",
    size: 110,
    accessorFn: (row) =>
      isGrantableAction(row.resourceId) ? "action" : "resource",
  },
  {
    field: "canRead",
    label: { en: "Read", ro: "Citire" },
    type: "boolean",
    size: 90,
  },
  {
    field: "canAdd",
    label: { en: "Add", ro: "Adăugare" },
    type: "boolean",
    size: 90,
  },
  {
    field: "canUpdate",
    label: { en: "Modify", ro: "Modificare" },
    type: "boolean",
    size: 90,
  },
  {
    field: "canDelete",
    label: { en: "Delete", ro: "Ștergere" },
    type: "boolean",
    size: 90,
  },
  {
    field: "allowed",
    label: { en: "Allowed", ro: "Permis" },
    type: "boolean",
    size: 90,
  },
];

// List/card presentation — mirrors the table fields, grouped and labeled
// for the card layout.
export const groupPermissionListColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", hidden: true },
  {
    field: "groupId",
    label: { en: "Group Id", ro: "Id grup" },
    type: "number",
    hidden: true,
  },
  {
    field: "groupName",
    label: { en: "Group", ro: "Grup" },
    type: "text",
    columnName: "name",
    origin: "group",
    hidden: true,
    accessorFn: (row) => row.group?.name,
  },
  {
    field: "resourceLabel",
    label: { en: "Resource", ro: "Resursă" },
    type: "text",
    accessorFn: (row, locale) => describeGrantResource(row.resourceId, locale),
    group: "resource",
    groupLabel: { en: "Resource", ro: "Resursă" },
  },
  {
    field: "resourceType",
    label: { en: "Type", ro: "Tip" },
    type: "text",
    accessorFn: (row) =>
      isGrantableAction(row.resourceId) ? "action" : "resource",
    group: "resource",
  },
  {
    field: "canRead",
    label: { en: "Read", ro: "Citire" },
    type: "boolean",
    group: "permissions",
    groupLabel: { en: "Permissions", ro: "Permisiuni" },
    prefix: { en: "Read:", ro: "Citire:" },
  },
  {
    field: "canAdd",
    label: { en: "Add", ro: "Adăugare" },
    type: "boolean",
    group: "permissions",
    prefix: { en: "Add:", ro: "Adăugare:" },
  },
  {
    field: "canUpdate",
    label: { en: "Modify", ro: "Modificare" },
    type: "boolean",
    group: "permissions",
    prefix: { en: "Modify:", ro: "Modificare:" },
  },
  {
    field: "canDelete",
    label: { en: "Delete", ro: "Ștergere" },
    type: "boolean",
    group: "permissions",
    prefix: { en: "Delete:", ro: "Ștergere:" },
  },
  {
    field: "allowed",
    label: { en: "Allowed", ro: "Permis" },
    type: "boolean",
    group: "permissions",
    prefix: { en: "Allowed:", ro: "Permis:" },
  },
];
