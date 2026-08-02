import { ResourceType } from "@/app/types/administration/Resource";
import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const resourceColumns: ColumnConfig[] = [
  { field: "id", label: "Id", type: "number", size: 70, cardHidden: true },
  {
    field: "name",
    label: "Name",
    type: "text",
    size: 200,
    hidden: true,
  },
  {
    field: "label",
    label: "Label",
    type: "text",
    size: 200,
  },
  {
    field: "type",
    label: "Type",
    type: "select",
    selectOptions: ResourceType.options,
    size: 110,
  },
  {
    field: "parent_name",
    label: "Parent",
    type: "text",
    size: 160,
    columnName: "name",
    origin: "parent",
    accessorFn: (row) => row.parent?.name,
  },
  {
    field: "singular_label",
    label: "Singular label",
    type: "text",
    size: 160,
    hidden: true,
  },
  {
    field: "table_name",
    label: "Table name",
    type: "text",
    size: 180,
    hidden: true,
  },
  { field: "description", label: "Description", type: "text", size: 320 },
  {
    field: "created_at",
    label: "Created at",
    type: "datetime",
    size: 140,
    hidden: true,
  },
];
