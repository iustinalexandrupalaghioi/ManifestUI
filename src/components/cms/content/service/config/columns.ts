import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { PageLocale } from "../../site-page/config/constants";

export const serviceColumns: ColumnConfig[] = [
  {
    field: "id",
    label: { en: "Id", ro: "Id" },
    type: "number",
    size: 55,
    hidden: true,
  },
  {
    field: "title",
    label: { en: "Title", ro: "Titlu" },
    type: "text",
    size: 240,
  },
  {
    field: "summary",
    label: { en: "Summary", ro: "Rezumat" },
    type: "text",
    size: 320,
  },
  {
    field: "slug",
    label: { en: "Address", ro: "Adresă" },
    type: "text",
    size: 160,
  },
  {
    field: "locale",
    label: { en: "Language", ro: "Limbă" },
    type: "select",
    selectOptions: PageLocale.options,
    size: 110,
  },
  {
    field: "position",
    label: { en: "Order", ro: "Ordine" },
    type: "number",
    size: 80,
  },
  {
    field: "published",
    label: { en: "Published", ro: "Publicat" },
    type: "boolean",
    size: 100,
  },
  {
    field: "updatedAt",
    label: { en: "Updated", ro: "Actualizat" },
    type: "datetime",
    size: 150,
  },
];

export const serviceListColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", hidden: true },
  { field: "title", label: { en: "Title", ro: "Titlu" }, type: "text" },
  { field: "summary", label: { en: "Summary", ro: "Rezumat" }, type: "text" },
  {
    field: "slug",
    label: { en: "Address", ro: "Adresă" },
    type: "text",
    hidden: true,
  },
  {
    field: "locale",
    label: { en: "Language", ro: "Limbă" },
    type: "select",
    selectOptions: PageLocale.options,
  },
  {
    field: "position",
    label: { en: "Order", ro: "Ordine" },
    type: "number",
    hidden: true,
  },
  {
    field: "published",
    label: { en: "Published", ro: "Publicat" },
    type: "boolean",
  },
  {
    field: "updatedAt",
    label: { en: "Updated", ro: "Actualizat" },
    type: "datetime",
    hidden: true,
  },
];
