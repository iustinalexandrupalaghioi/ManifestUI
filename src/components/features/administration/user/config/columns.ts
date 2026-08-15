import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const userColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "text", size: 280, cardHidden: true },
  {
    field: "full_name",
    label: { en: "Full name", ro: "Nume complet" },
    type: "text",
    size: 200,
    cardGroup: "user",
    cardGroupLabel: { en: "User", ro: "Utilizator" },
  },
  {
    field: "email",
    label: { en: "Email", ro: "Email" },
    type: "text",
    size: 220,
    cardGroup: "user",
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
