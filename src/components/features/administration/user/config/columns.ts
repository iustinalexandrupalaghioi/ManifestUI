import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const userColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "text", size: 280 },
  {
    field: "full_name",
    label: { en: "Full name", ro: "Nume complet" },
    type: "text",
    size: 200,
  },
  {
    field: "email",
    label: { en: "Email", ro: "Email" },
    type: "text",
    size: 220,
  },
  { field: "phone", label: { en: "Phone", ro: "Telefon" }, type: "text", size: 140, hidden: true },
  {
    field: "administrator",
    label: { en: "Administrator", ro: "Administrator" },
    type: "boolean",
    size: 120,
  },
  {
    field: "created_at",
    label: { en: "Signed up", ro: "Înregistrat" },
    type: "datetime",
    size: 140,
    hidden: true,
  },
];

// List/card presentation — mirrors the table fields, grouped and labeled
// for the card layout.
export const userListColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "text", hidden: true },
  {
    field: "full_name",
    label: { en: "Full name", ro: "Nume complet" },
    type: "text",
    group: "user",
    groupLabel: { en: "User", ro: "Utilizator" },
  },
  {
    field: "email",
    label: { en: "Email", ro: "Email" },
    type: "text",
    group: "user",
  },
  { field: "phone", label: { en: "Phone", ro: "Telefon" }, type: "text", hidden: true },
  {
    field: "administrator",
    label: { en: "Administrator", ro: "Administrator" },
    type: "boolean",
  },
  {
    field: "created_at",
    label: { en: "Signed up", ro: "Înregistrat" },
    type: "datetime",
    hidden: true,
  },
];
