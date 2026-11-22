import { contentStatusColumns } from "@/framework/content/statusOptions";
import { routing } from "@/i18n/routing";
import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const sitePageColumns: ColumnConfig[] = [
  {
    field: "id",
    label: { en: "Id", ro: "Id" },
    type: "number",
    size: 55,
    hidden: true,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "sum",
  },
  {
    field: "title",
    label: { en: "Title", ro: "Titlu" },
    type: "text",
    size: 260,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "slug",
    label: { en: "Page address", ro: "Adresa paginii" },
    type: "text",
    size: 200,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "locale",
    label: { en: "Language", ro: "Limbă" },
    type: "text",
    selectOptions: [
      { value: "en", label: { en: "English", ro: "Engleză" } },
      { value: "ro", label: { en: "Romanian", ro: "Română" } },
    ],
    size: 110,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "kind",
    label: { en: "Type", ro: "Tip" },
    type: "text",
    selectOptions: [
      { value: "text", label: { en: "Text page", ro: "Pagină de text" } },
      {
        value: "sections",
        label: { en: "Sections page", ro: "Pagină din secțiuni" },
      },
    ],
    size: 140,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "updatedAt",
    label: { en: "Updated", ro: "Actualizată" },
    type: "datetime",
    size: 150,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  ...contentStatusColumns(routing.locales)
];

export const sitePageListColumns: ColumnConfig[] = [
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
    field: "title",
    label: { en: "Title", ro: "Titlu" },
    type: "text",
    cardTitle: true,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "slug",
    label: { en: "Page address", ro: "Adresa paginii" },
    type: "text",
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "locale",
    label: { en: "Language", ro: "Limbă" },
    type: "text",
    selectOptions: [
      { value: "en", label: { en: "English", ro: "Engleză" } },
      { value: "ro", label: { en: "Romanian", ro: "Română" } },
    ],
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "kind",
    label: { en: "Type", ro: "Tip" },
    type: "text",
    selectOptions: [
      { value: "text", label: { en: "Text page", ro: "Pagină de text" } },
      {
        value: "sections",
        label: { en: "Sections page", ro: "Pagină din secțiuni" },
      },
    ],
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "updatedAt",
    label: { en: "Updated", ro: "Actualizată" },
    type: "datetime",
    hidden: true,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  ...contentStatusColumns(routing.locales)
];

export const sitePagePickupColumns: ColumnConfig[] = [

];
