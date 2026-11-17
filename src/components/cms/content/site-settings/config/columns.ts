import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { PageLocale } from "../../site-page/config/constants";

export const siteSettingsColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", size: 55, hidden: true },
  { field: "locale", label: { en: "Language", ro: "Limbă" }, type: "select", selectOptions: PageLocale.options, size: 160 },
  { field: "updatedAt", label: { en: "Updated", ro: "Actualizată" }, type: "datetime", size: 170 },
];

export const siteSettingsListColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", hidden: true },
  { field: "locale", label: { en: "Language", ro: "Limbă" }, type: "select", selectOptions: PageLocale.options },
  { field: "updatedAt", label: { en: "Updated", ro: "Actualizată" }, type: "datetime" },
];
