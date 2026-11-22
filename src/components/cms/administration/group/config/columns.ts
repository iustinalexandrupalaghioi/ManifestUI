import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const groupColumns: ColumnConfig[] = [
  {
    field: "id",
    label: { en: "Id", ro: "Id" },
    type: "number",
    size: 55,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "sum",
  },
  {
    field: "name",
    label: { en: "Name", ro: "Nume" },
    type: "text",
    size: 220,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "description",
    label: { en: "Description", ro: "Descriere" },
    type: "text",
    size: 320,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "createdAt",
    label: { en: "Created at", ro: "Data creării" },
    type: "datetime",
    size: 140,
    hidden: true,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  }
];

export const groupListColumns: ColumnConfig[] = [
  {
    field: "id",
    label: { en: "Id", ro: "Id" },
    type: "number",
    hidden: true,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "sum",
  },
  {
    field: "name",
    label: { en: "Name", ro: "Nume" },
    type: "text",
    cardTitle: true,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "description",
    label: { en: "Description", ro: "Descriere" },
    type: "text",
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "createdAt",
    label: { en: "Created at", ro: "Data creării" },
    type: "datetime",
    hidden: true,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  }
];

export const groupPickupColumns: ColumnConfig[] = [

];
