import { contentStatusColumns } from "@/framework/content/statusOptions";
import { routing } from "@/i18n/routing";
import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const siteInfoColumns: ColumnConfig[] = [
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
    field: "locale",
    label: { en: "Language", ro: "Limbă" },
    type: "text",
    selectOptions: [
      { value: "en", label: { en: "English", ro: "Engleză" } },
      { value: "ro", label: { en: "Romanian", ro: "Română" } },
    ],
    size: 120,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  {
    field: "siteName",
    label: { en: "Site name", ro: "Numele site-ului" },
    type: "text",
    size: 220,
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

export const siteInfoListColumns: ColumnConfig[] = [
  {
    field: "id",
    label: { en: "Id", ro: "Id" },
    type: "number",
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "sum",
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
    field: "siteName",
    label: { en: "Site name", ro: "Numele site-ului" },
    type: "text",
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
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  ...contentStatusColumns(routing.locales)
];

export const siteInfoPickupColumns: ColumnConfig[] = [
  {
    field: "id",
    label: { en: "Id", ro: "Id" },
    type: "number",
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "sum",
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
    field: "siteName",
    label: { en: "Site name", ro: "Numele site-ului" },
    type: "text",
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
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  }
];
