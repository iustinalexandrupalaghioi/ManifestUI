import { contentStatusColumns } from "@/framework/content/statusOptions";
import { routing } from "@/i18n/routing";
import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";

export const siteSettingsColumns: ColumnConfig[] = [
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
    size: 160,
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
    size: 170,
    sortable: true,
    filterable: true,
    aggregatable: true,
    groupable: true,
    defaultAggregate: "count",
  },
  ...contentStatusColumns(routing.locales)
];

export const siteSettingsListColumns: ColumnConfig[] = [
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
    field: "locale",
    label: { en: "Language", ro: "Limbă" },
    type: "text",
    selectOptions: [
      { value: "en", label: { en: "English", ro: "Engleză" } },
      { value: "ro", label: { en: "Romanian", ro: "Română" } },
    ],
    cardTitle: true,
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

export const siteSettingsPickupColumns: ColumnConfig[] = [
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
