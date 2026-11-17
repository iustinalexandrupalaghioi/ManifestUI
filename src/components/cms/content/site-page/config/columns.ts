import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { PageKind, PageLocale } from "./constants";

export const sitePageColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", size: 55, hidden: true },
  { field: "title", label: { en: "Title", ro: "Titlu" }, type: "text", size: 260 },
  { field: "slug", label: { en: "Page address", ro: "Adresa paginii" }, type: "text", size: 200 },
  { field: "locale", label: { en: "Language", ro: "Limbă" }, type: "select", selectOptions: PageLocale.options, size: 110 },
  { field: "kind", label: { en: "Type", ro: "Tip" }, type: "select", selectOptions: PageKind.options, size: 140 },
  { field: "published", label: { en: "Published", ro: "Publicată" }, type: "boolean", size: 100 },
  { field: "updatedAt", label: { en: "Updated", ro: "Actualizată" }, type: "datetime", size: 150 },
];

export const sitePageListColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", hidden: true },
  { field: "title", label: { en: "Title", ro: "Titlu" }, type: "text" },
  { field: "slug", label: { en: "Page address", ro: "Adresa paginii" }, type: "text" },
  { field: "locale", label: { en: "Language", ro: "Limbă" }, type: "select", selectOptions: PageLocale.options },
  { field: "kind", label: { en: "Type", ro: "Tip" }, type: "select", selectOptions: PageKind.options },
  { field: "published", label: { en: "Published", ro: "Publicată" }, type: "boolean" },
  { field: "updatedAt", label: { en: "Updated", ro: "Actualizată" }, type: "datetime", hidden: true },
];
