import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const groupColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", size: 55 },
  { field: "name", label: { en: "Name", ro: "Nume" }, type: "text", size: 220 },
  { field: "description", label: { en: "Description", ro: "Descriere" }, type: "text", size: 320 },
  {
    field: "created_at",
    label: { en: "Created at", ro: "Data creării" },
    type: "datetime",
    size: 140,
    hidden: true,
  },
];

export const groupListColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", hidden: true },
  { field: "name", label: { en: "Name", ro: "Nume" }, type: "text" },
  { field: "description", label: { en: "Description", ro: "Descriere" }, type: "text" },
  {
    field: "created_at",
    label: { en: "Created at", ro: "Data creării" },
    type: "datetime",
    hidden: true,
  },
];
