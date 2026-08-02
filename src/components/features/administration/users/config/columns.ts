import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const userColumns: ColumnConfig[] = [
  { field: "id", label: "Id", type: "text", size: 280, cardHidden: true },
  {
    field: "full_name",
    label: "Full name",
    type: "text",
    size: 200,
    cardGroup: "user",
    cardGroupLabel: "User",
  },
  {
    field: "email",
    label: "Email",
    type: "text",
    size: 220,
    cardGroup: "user",
  },
  { field: "phone", label: "Phone", type: "text", size: 140, hidden: true },
  {
    field: "administrator",
    label: "Administrator",
    type: "boolean",
    size: 120,
  },
  {
    field: "created_at",
    label: "Signed up",
    type: "datetime",
    size: 140,
    hidden: true,
  },
];
