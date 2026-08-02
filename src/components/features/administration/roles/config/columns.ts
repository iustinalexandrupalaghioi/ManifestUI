import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const roleColumns: ColumnConfig[] = [
  { field: "id", label: "Id", type: "number", size: 55, cardHidden: true },
  { field: "name", label: "Name", type: "text", size: 220 },
  { field: "description", label: "Description", type: "text", size: 320 },
  {
    field: "created_at",
    label: "Created at",
    type: "datetime",
    size: 140,
    hidden: true,
  },
];
