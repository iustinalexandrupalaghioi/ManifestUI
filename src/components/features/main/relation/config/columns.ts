import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { Gender } from "@/app/types/main/Relation";

export const relationColumns: ColumnConfig[] = [
  // ── Identity ─────────────────────────────────
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", size: 70 },
  {
    field: "first_name",
    label: { en: "First name", ro: "Prenume" },
    type: "text",
    size: 140,
  },
  {
    field: "last_name",
    label: { en: "Last name", ro: "Nume" },
    type: "text",
    size: 140,
  },
  { field: "username", label: { en: "Username", ro: "Nume utilizator" }, type: "text", size: 140 },
  { field: "email", label: { en: "Email", ro: "Email" }, type: "text", size: 220 },

  // ── Demographics ──────────────────────────────
  {
    field: "gender",
    label: { en: "Gender", ro: "Gen" },
    type: "select",
    size: 110,
    selectOptions: Gender.options,
  },
  {
    field: "age",
    label: { en: "Age", ro: "Vârstă" },
    type: "number",
    size: 90,
    defaultAggregate: "avg",
  },
  {
    field: "birth_date",
    label: { en: "Birth date", ro: "Data nașterii" },
    type: "date",
    size: 120,
    hidden: true,
  },

  // ── Contact ───────────────────────────────────
  { field: "phone", label: { en: "Phone", ro: "Telefon" }, type: "text", size: 140, hidden: true },

  // ── Physical ──────────────────────────────────
  {
    field: "height",
    label: { en: "Height", ro: "Înălțime" },
    type: "number",
    size: 90,
    hidden: true,
  },
  {
    field: "weight",
    label: { en: "Weight", ro: "Greutate" },
    type: "number",
    size: 90,
    hidden: true,
  },
  {
    field: "blood_group",
    label: { en: "Blood group", ro: "Grupă sanguină" },
    type: "text",
    size: 110,
    hidden: true,
  },

  // ── Appearance ────────────────────────────────
  {
    field: "eye_color",
    label: { en: "Eye color", ro: "Culoarea ochilor" },
    type: "text",
    size: 130,
    hidden: true,
  },
  {
    field: "hair_color",
    label: { en: "Hair color", ro: "Culoarea părului" },
    type: "text",
    size: 130,
    hidden: true,
  },
  {
    field: "hair_type",
    label: { en: "Hair type", ro: "Tip de păr" },
    type: "text",
    size: 130,
    hidden: true,
  },

  // ── Meta ──────────────────────────────────────
  {
    field: "created_at",
    label: { en: "Created at", ro: "Data creării" },
    type: "datetime",
    size: 140,
    hidden: true,
  },
];

// List/card presentation — same fields as the table, grouped and labeled
// for the card layout. `hidden` here controls default visibility in card
// view independently of the table's own `hidden` above.
export const relationListColumns: ColumnConfig[] = [
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", hidden: true },
  {
    field: "first_name",
    label: { en: "First name", ro: "Prenume" },
    type: "text",
    group: "name",
    groupLabel: { en: "Name", ro: "Nume" },
  },
  {
    field: "last_name",
    label: { en: "Last name", ro: "Nume" },
    type: "text",
    group: "name",
  },
  { field: "username", label: { en: "Username", ro: "Nume utilizator" }, type: "text" },
  { field: "email", label: { en: "Email", ro: "Email" }, type: "text" },
  {
    field: "gender",
    label: { en: "Gender", ro: "Gen" },
    type: "select",
    selectOptions: Gender.options,
    group: "demo",
    groupLabel: { en: "Gender / Age", ro: "Gen / Vârstă" },
  },
  {
    field: "age",
    label: { en: "Age", ro: "Vârstă" },
    type: "number",
    group: "demo",
    inlineLabel: { en: "years", ro: "ani" },
    labelPosition: "after",
  },
  {
    field: "birth_date",
    label: { en: "Birth date", ro: "Data nașterii" },
    type: "date",
    group: "demo",
  },
  { field: "phone", label: { en: "Phone", ro: "Telefon" }, type: "text", hidden: true },
  {
    field: "height",
    label: { en: "Height", ro: "Înălțime" },
    type: "number",
    hidden: true,
    group: "physical",
    groupLabel: { en: "Height / Weight", ro: "Înălțime / Greutate" },
    inlineLabel: { en: "cm", ro: "cm" },
    labelPosition: "after",
  },
  {
    field: "weight",
    label: { en: "Weight", ro: "Greutate" },
    type: "number",
    hidden: true,
    group: "physical",
    inlineLabel: { en: "KG", ro: "KG" },
    labelPosition: "after",
  },
  {
    field: "blood_group",
    label: { en: "Blood group", ro: "Grupă sanguină" },
    type: "text",
    hidden: true,
    group: "physical",
  },
  {
    field: "eye_color",
    label: { en: "Eye color", ro: "Culoarea ochilor" },
    type: "text",
    hidden: true,
    group: "appearance",
    groupLabel: { en: "Eyes / Hair", ro: "Ochi / Păr" },
    inlineLabel: { en: "Eyes", ro: "Ochi" },
    labelPosition: "before",
  },
  {
    field: "hair_color",
    label: { en: "Hair color", ro: "Culoarea părului" },
    type: "text",
    hidden: true,
    group: "appearance",
    inlineLabel: { en: "Hair", ro: "Păr" },
    labelPosition: "before",
  },
  {
    field: "hair_type",
    label: { en: "Hair type", ro: "Tip de păr" },
    type: "text",
    hidden: true,
    group: "appearance",
    inlineLabel: { en: "Type", ro: "Tip" },
    labelPosition: "before",
  },
  {
    field: "created_at",
    label: { en: "Created at", ro: "Data creării" },
    type: "datetime",
    hidden: true,
  },
];
