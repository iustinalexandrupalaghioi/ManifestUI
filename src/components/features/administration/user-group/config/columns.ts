import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const userGroupColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "text", size: 160 },
  // Not shown — exists only so the groups→users and users→groups relation
  // tabs can pre-filter by them (see src/components/features/administration/group/config/
  // relations.ts and src/components/features/administration/user/config/relations.ts).
  { field: "group_id", label: { en: "Group Id", ro: "Id grup" }, type: "number", hidden: true },
  { field: "user_id", label: { en: "User Id", ro: "Id utilizator" }, type: "text", hidden: true },
  {
    field: "user_full_name",
    label: { en: "Full name", ro: "Nume complet" },
    type: "text",
    size: 180,
    columnName: "full_name",
    origin: "user",
    accessorFn: (row) => row.user?.full_name,
  },
  {
    field: "user_email",
    label: { en: "Email", ro: "Email" },
    type: "text",
    size: 220,
    columnName: "email",
    origin: "user",
    accessorFn: (row) => row.user?.email,
  },
  {
    field: "group_name",
    label: { en: "Group", ro: "Grup" },
    type: "text",
    size: 200,
    columnName: "name",
    origin: "group",
    accessorFn: (row) => row.group?.name,
  },
  {
    field: "created_at",
    label: { en: "Added", ro: "Adăugat" },
    type: "datetime",
    size: 140,
    hidden: true,
  },
];

// List/card presentation — mirrors the table fields, grouped and labeled
// for the card layout.
export const userGroupListColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "text", hidden: true },
  { field: "group_id", label: { en: "Group Id", ro: "Id grup" }, type: "number", hidden: true },
  { field: "user_id", label: { en: "User Id", ro: "Id utilizator" }, type: "text", hidden: true },
  {
    field: "user_full_name",
    label: { en: "Full name", ro: "Nume complet" },
    type: "text",
    columnName: "full_name",
    origin: "user",
    accessorFn: (row) => row.user?.full_name,
    group: "user",
    groupLabel: { en: "User", ro: "Utilizator" },
  },
  {
    field: "user_email",
    label: { en: "Email", ro: "Email" },
    type: "text",
    columnName: "email",
    origin: "user",
    accessorFn: (row) => row.user?.email,
    group: "user",
  },
  {
    field: "group_name",
    label: { en: "Group", ro: "Grup" },
    type: "text",
    columnName: "name",
    origin: "group",
    accessorFn: (row) => row.group?.name,
  },
  {
    field: "created_at",
    label: { en: "Added", ro: "Adăugat" },
    type: "datetime",
    hidden: true,
  },
];
