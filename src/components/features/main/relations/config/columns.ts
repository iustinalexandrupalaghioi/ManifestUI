import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { Gender } from "@/app/types/main/Relation";

export const relationColumns: ColumnConfig[] = [
  // ── Identity ─────────────────────────────────
  { field: "id", label: { en: "Id", ro: "Id" }, type: "number", size: 70, cardHidden: true },
  {
    field: "first_name",
    label: { en: "First name", ro: "Prenume" },
    type: "text",
    size: 140,
    cardGroup: "name",
    cardGroupLabel: { en: "Name", ro: "Nume" },
  },
  {
    field: "last_name",
    label: { en: "Last name", ro: "Nume" },
    type: "text",
    size: 140,
    cardGroup: "name",
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
    cardGroup: "demo",
    cardGroupLabel: { en: "Gender / Age", ro: "Gen / Vârstă" },
  },
  {
    field: "age",
    label: { en: "Age", ro: "Vârstă" },
    type: "number",
    size: 90,
    cardGroup: "demo",
    cardLabel: { en: "years", ro: "ani" },
    cardLabelPosition: "after",
  },
  {
    field: "birth_date",
    label: { en: "Birth date", ro: "Data nașterii" },
    type: "date",
    size: 120,
    cardGroup: "demo",
    hidden: true,
    cardHidden: false,
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
    cardGroup: "physical",
    cardGroupLabel: { en: "Height / Weight", ro: "Înălțime / Greutate" },
    cardHidden: true,
    cardLabel: { en: "cm", ro: "cm" },
    cardLabelPosition: "after",
  },
  {
    field: "weight",
    label: { en: "Weight", ro: "Greutate" },
    type: "number",
    size: 90,
    hidden: true,
    cardGroup: "physical",
    cardHidden: true,
    cardLabel: { en: "KG", ro: "KG" },
    cardLabelPosition: "after",
  },
  {
    field: "blood_group",
    label: { en: "Blood group", ro: "Grupă sanguină" },
    type: "text",
    size: 110,
    hidden: true,
    cardGroup: "physical",
    cardHidden: true,
  },

  // ── Appearance ────────────────────────────────
  {
    field: "eye_color",
    label: { en: "Eye color", ro: "Culoarea ochilor" },
    type: "text",
    size: 130,
    hidden: true,
    cardGroup: "appearance",
    cardGroupLabel: { en: "Eyes / Hair", ro: "Ochi / Păr" },
    cardHidden: true,
    cardLabel: { en: "Eyes", ro: "Ochi" },
    cardLabelPosition: "before",
  },
  {
    field: "hair_color",
    label: { en: "Hair color", ro: "Culoarea părului" },
    type: "text",
    size: 130,
    hidden: true,
    cardGroup: "appearance",
    cardHidden: true,
    cardLabel: { en: "Hair", ro: "Păr" },
    cardLabelPosition: "before",
  },
  {
    field: "hair_type",
    label: { en: "Hair type", ro: "Tip de păr" },
    type: "text",
    size: 130,
    hidden: true,
    cardGroup: "appearance",
    cardHidden: true,
    cardLabel: { en: "Type", ro: "Tip" },
    cardLabelPosition: "before",
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
