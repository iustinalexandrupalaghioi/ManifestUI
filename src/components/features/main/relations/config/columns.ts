import type { ColumnConfig } from "@/framework/components/data-view/core/ui/createColumnsFromConfig";
import { Gender } from "@/app/types/main/Relation";

export const relationColumns: ColumnConfig[] = [
  // ── Identity ─────────────────────────────────
  { field: "id", label: "Id", type: "number", size: 70, cardHidden: true },
  {
    field: "first_name",
    label: "First name",
    type: "text",
    size: 140,
    cardGroup: "name",
    cardGroupLabel: "Name",
  },
  {
    field: "last_name",
    label: "Last name",
    type: "text",
    size: 140,
    cardGroup: "name",
  },
  { field: "username", label: "Username", type: "text", size: 140 },
  { field: "email", label: "Email", type: "text", size: 220 },

  // ── Demographics ──────────────────────────────
  {
    field: "gender",
    label: "Gender",
    type: "select",
    size: 110,
    selectOptions: Gender.options,
    cardGroup: "demo",
    cardGroupLabel: "Gender / Age",
  },
  {
    field: "age",
    label: "Age",
    type: "number",
    size: 90,
    cardGroup: "demo",
    cardLabel: "years",
    cardLabelPosition: "after",
  },
  {
    field: "birth_date",
    label: "Birth date",
    type: "date",
    size: 120,
    cardGroup: "demo",
    hidden: true,
    cardHidden: false,
  },

  // ── Contact ───────────────────────────────────
  { field: "phone", label: "Phone", type: "text", size: 140, hidden: true },

  // ── Physical ──────────────────────────────────
  {
    field: "height",
    label: "Height",
    type: "number",
    size: 90,
    hidden: true,
    cardGroup: "physical",
    cardGroupLabel: "Height / Weight",
    cardHidden: true,
    cardLabel: "cm",
    cardLabelPosition: "after",
  },
  {
    field: "weight",
    label: "Weight",
    type: "number",
    size: 90,
    hidden: true,
    cardGroup: "physical",
    cardHidden: true,
    cardLabel: "KG",
    cardLabelPosition: "after",
  },
  {
    field: "blood_group",
    label: "Blood group",
    type: "text",
    size: 110,
    hidden: true,
    cardGroup: "physical",
    cardHidden: true,
  },

  // ── Appearance ────────────────────────────────
  {
    field: "eye_color",
    label: "Eye color",
    type: "text",
    size: 130,
    hidden: true,
    cardGroup: "appearance",
    cardGroupLabel: "Eyes / Hair",
    cardHidden: true,
    cardLabel: "Eyes",
    cardLabelPosition: "before",
  },
  {
    field: "hair_color",
    label: "Hair color",
    type: "text",
    size: 130,
    hidden: true,
    cardGroup: "appearance",
    cardHidden: true,
    cardLabel: "Hair",
    cardLabelPosition: "before",
  },
  {
    field: "hair_type",
    label: "Hair type",
    type: "text",
    size: 130,
    hidden: true,
    cardGroup: "appearance",
    cardHidden: true,
    cardLabel: "Type",
    cardLabelPosition: "before",
  },

  // ── Meta ──────────────────────────────────────
  {
    field: "created_at",
    label: "Created at",
    type: "datetime",
    size: 140,
    hidden: true,
  },
];
