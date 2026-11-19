import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { describeGrantResource, isGrantableAction } from "@/app/[locale]/cms/grantablePermissions";

// ✓ / ✕ badges for the permission flags (grid and cards), shown only where the flag applies
// (record permissions for a resource, "Allowed" for an action), and the type as a badge.
type Row = Parameters<NonNullable<ColumnConfig["accessorFn"]>>[0];

/** ✓ granted (green) / ✕ not granted (grey), named by the permission. */
const grantBadges = (en: string, ro: string): ColumnConfig["selectOptions"] => (locale) => {
  const name = locale === "ro" ? ro : en;
  return [
    { value: "true", label: `✓ ${name}`, tone: "success" },
    { value: "false", label: `✕ ${name}`, tone: "neutral" },
  ];
};

/** A permission flag on the card, shown only where it applies (empty values are left out). */
const permissionCard = (
  field: string,
  key: "canRead" | "canAdd" | "canUpdate" | "canDelete" | "allowed",
  en: string,
  ro: string,
  appliesTo: "resource" | "action",
  first = false,
): ColumnConfig => ({
  field,
  label: { en, ro },
  type: "boolean",
  sortable: false,
  filterable: false,
  accessorFn: (row: Row) =>
    grantType(row) === appliesTo ? !!row[key] : null,
  selectOptions: grantBadges(en, ro),
  group: "permissions",
  cardWide: true,
  ...(first ? { groupLabel: { en: "Permissions", ro: "Permisiuni" } } : {}),
});

/** ✓ Yes (green) / ✕ No (grey), for the grid, where the column header names the permission. */
const yesNoBadges: ColumnConfig["selectOptions"] = (locale) => [
  { value: "true", label: locale === "ro" ? "✓ Da" : "✓ Yes", tone: "success" },
  { value: "false", label: locale === "ro" ? "✕ Nu" : "✕ No", tone: "neutral" },
];

/** Which grant a row is: an action (allowed or not) or a resource (read/add/modify/delete). */
const grantType = (row: Row) => (isGrantableAction(row.resourceId) ? "action" : "resource");

const typeBadges: ColumnConfig["selectOptions"] = (locale) => [
  { value: "resource", label: locale === "ro" ? "Resursă" : "Resource", tone: "info" },
  { value: "action", label: locale === "ro" ? "Acțiune" : "Action", tone: "warning" },
];

/** The form field a permission column edits (the form is keyed in snake_case). */
const FORM_FIELD = {
  canRead: "can_read",
  canAdd: "can_add",
  canUpdate: "can_update",
  canDelete: "can_delete",
  allowed: "allowed",
} as const;

/**
 * A grid permission column: a badge where the flag applies, empty where it doesn't. In edit
 * mode it edits its form field like a plain boolean column; the badge reads an unsaved edit
 * (keyed by the form field) before the saved value.
 */
const permissionColumn = (
  field: keyof typeof FORM_FIELD,
  en: string,
  ro: string,
  appliesTo: "resource" | "action",
): ColumnConfig => ({
  field,
  label: { en, ro },
  type: "boolean",
  size: 110,
  editingField: FORM_FIELD[field],
  accessorFn: (row: Row) =>
    grantType(row) === appliesTo ? !!(row[FORM_FIELD[field]] ?? row[field]) : null,
  selectOptions: yesNoBadges,
});

export const groupPermissionColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", size: 70 },
  // Not shown — exists only so the groups→permissions relation tab can
  // pre-filter by it (see src/components/cms/administration/group/config/relations.ts).
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
    type: "select",
    size: 120,
    accessorFn: grantType,
    selectOptions: typeBadges,
  },
  permissionColumn("canRead", "Read", "Citire", "resource"),
  permissionColumn("canAdd", "Add", "Adăugare", "resource"),
  permissionColumn("canUpdate", "Modify", "Modificare", "resource"),
  permissionColumn("canDelete", "Delete", "Ștergere", "resource"),
  permissionColumn("allowed", "Allowed", "Permis", "action"),
];

// Card presentation: the resource as the heading, its type as a badge, and the permissions
// that apply to it (record permissions for a resource, "Allowed" for an action) as a row of
// ✓ / ✕ badges. Card-only columns (card*) have their own ids: a column shared with the grid
// keeps the grid's cell renderer, and these render as badges.
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
    cardTitle: true,
    label: { en: "Resource", ro: "Resursă" },
    type: "text",
    accessorFn: (row, locale) => describeGrantResource(row.resourceId, locale),
  },
  {
    field: "cardType",
    label: { en: "Type", ro: "Tip" },
    type: "select",
    sortable: false,
    filterable: false,
    accessorFn: grantType,
    selectOptions: typeBadges,
  },
  permissionCard("cardRead", "canRead", "Read", "Citire", "resource", true),
  permissionCard("cardAdd", "canAdd", "Add", "Adăugare", "resource"),
  permissionCard("cardUpdate", "canUpdate", "Modify", "Modificare", "resource"),
  permissionCard("cardDelete", "canDelete", "Delete", "Ștergere", "resource"),
  permissionCard("cardAllowed", "allowed", "Allowed", "Permis", "action"),
];
