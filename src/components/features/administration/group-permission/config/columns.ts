import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { describeGrantResource, isGrantableAction } from "@/app/[locale]/cms/grantablePermissions";

export const groupPermissionColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", size: 70 },
  // Not shown — exists only so the groups→permissions relation tab can
  // pre-filter by it (see src/components/features/administration/group/config/relations.ts).
  {
    field: "group_id",
    label: { en: "Group Id", ro: "Id grup" },
    type: "number",
    hidden: true,
  },
  {
    field: "group_name",
    label: { en: "Group", ro: "Grup" },
    type: "text",
    size: 160,
    columnName: "name",
    origin: "group",
    hidden: true,
    accessorFn: (row) => row.group?.name,
  },
  {
    field: "resource_label",
    label: { en: "Resource", ro: "Resursă" },
    type: "text",
    size: 200,
    accessorFn: (row, locale) => describeGrantResource(row.resource_id, locale),
    // Editing this column edits the underlying resource_id combobox field,
    // not the derived "resource_label" — which isn't a real form field.
    editingField: "resource_id",
  },
  {
    field: "resource_type",
    label: { en: "Type", ro: "Tip" },
    type: "text",
    size: 110,
    accessorFn: (row) =>
      isGrantableAction(row.resource_id) ? "action" : "resource",
  },
  {
    field: "can_read",
    label: { en: "Read", ro: "Citire" },
    type: "boolean",
    size: 90,
  },
  {
    field: "can_add",
    label: { en: "Add", ro: "Adăugare" },
    type: "boolean",
    size: 90,
  },
  {
    field: "can_update",
    label: { en: "Modify", ro: "Modificare" },
    type: "boolean",
    size: 90,
  },
  {
    field: "can_delete",
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
    field: "group_id",
    label: { en: "Group Id", ro: "Id grup" },
    type: "number",
    hidden: true,
  },
  {
    field: "group_name",
    label: { en: "Group", ro: "Grup" },
    type: "text",
    columnName: "name",
    origin: "group",
    hidden: true,
    accessorFn: (row) => row.group?.name,
  },
  {
    field: "resource_label",
    label: { en: "Resource", ro: "Resursă" },
    type: "text",
    accessorFn: (row, locale) => describeGrantResource(row.resource_id, locale),
    group: "resource",
    groupLabel: { en: "Resource", ro: "Resursă" },
  },
  {
    field: "resource_type",
    label: { en: "Type", ro: "Tip" },
    type: "text",
    accessorFn: (row) =>
      isGrantableAction(row.resource_id) ? "action" : "resource",
    group: "resource",
  },
  {
    field: "can_read",
    label: { en: "Read", ro: "Citire" },
    type: "boolean",
    group: "permissions",
    groupLabel: { en: "Permissions", ro: "Permisiuni" },
    inlineLabel: { en: "Read", ro: "Citire" },
    labelPosition: "before",
  },
  {
    field: "can_add",
    label: { en: "Add", ro: "Adăugare" },
    type: "boolean",
    group: "permissions",
    inlineLabel: { en: "Add", ro: "Adăugare" },
    labelPosition: "before",
  },
  {
    field: "can_update",
    label: { en: "Modify", ro: "Modificare" },
    type: "boolean",
    group: "permissions",
    inlineLabel: { en: "Modify", ro: "Modificare" },
    labelPosition: "before",
  },
  {
    field: "can_delete",
    label: { en: "Delete", ro: "Ștergere" },
    type: "boolean",
    group: "permissions",
    inlineLabel: { en: "Delete", ro: "Ștergere" },
    labelPosition: "before",
  },
  {
    field: "allowed",
    label: { en: "Allowed", ro: "Permis" },
    type: "boolean",
    group: "permissions",
    inlineLabel: { en: "Allowed", ro: "Permis" },
    labelPosition: "before",
  },
];
