import type { FormConfig } from "@/framework/components/form/types/types";
import type { FieldTabConfig } from "@/framework/types/tab-config-type";
import { Gender } from "@/app/types/main/Relation";
import type { RelationFormValues } from "./schema";

// ─── Main form (core fields only) ────────────────────────────────────────────

export const relationsForm: FormConfig<RelationFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 2,
        fields: [
          {
            type: "readonly",
            name: "id",
            label: { en: "Id", ro: "Id" },
            span: 1,
          },
          {
            type: "input",
            name: "username",
            label: { en: "Username", ro: "Nume utilizator" },
            span: 1,
          },
          {
            type: "input",
            name: "first_name",
            label: { en: "First name", ro: "Prenume" },
            span: 1,
          },
          {
            type: "input",
            name: "last_name",
            label: { en: "Last name", ro: "Nume" },
            span: 1,
          },
          {
            type: "input",
            name: "maiden_name",
            label: { en: "Maiden name", ro: "Nume de fată" },
            span: 1,
          },
          {
            type: "select",
            name: "gender",
            label: { en: "Gender", ro: "Gen" },
            span: 1,
            options: Gender.options,
            placeholder: "Select gender",
          },
          {
            type: "input",
            name: "age",
            label: { en: "Age", ro: "Vârstă" },
            span: 1,
            inputType: "number",
            min: 0,
          },
          {
            type: "date",
            name: "birth_date",
            label: { en: "Birth date", ro: "Data nașterii" },
            span: 1,
          },
        ],
      },
    ],
  },
};

// ─── Contact sections (shared between tabs and addTabs) ───────────────────────

const contactSections: FieldTabConfig<RelationFormValues>["sections"] = [
  {
    cols: 1,
    className: "max-w-[50%]",
    fields: [
      {
        type: "input",
        name: "email",
        label: { en: "Email", ro: "Email" },
        inputType: "email",
        placeholder: "Email address",
      },
      {
        type: "input",
        name: "phone",
        label: { en: "Phone", ro: "Telefon" },
        inputType: "tel",
        placeholder: "Phone number",
      },
    ],
  },
];

const profileSections: FieldTabConfig<RelationFormValues>["sections"] = [
  {
    cols: 1,
    fields: [
      {
        type: "file",
        name: "image",
        label: { en: "Profile image", ro: "Imagine de profil" },
        bucket: "users",
        accept: "image/*",
        maxSize: 5 * 1024 * 1024,
        maxFiles: 1,
      },
    ],
  },
];

const physicalSections: FieldTabConfig<RelationFormValues>["sections"] = [
  {
    cols: 2,
    fields: [
      {
        type: "input",
        name: "blood_group",
        label: { en: "Blood group", ro: "Grupă sanguină" },
        span: 1,
        placeholder: "e.g. A+",
      },
      {
        type: "input",
        name: "height",
        label: { en: "Height (cm)", ro: "Înălțime (cm)" },
        span: 1,
        inputType: "number",
        min: 0,
      },
      {
        type: "input",
        name: "weight",
        label: { en: "Weight (kg)", ro: "Greutate (kg)" },
        span: 1,
        inputType: "number",
        min: 0,
      },
      {
        type: "input",
        name: "eye_color",
        label: { en: "Eye color", ro: "Culoarea ochilor" },
        span: 1,
      },
      {
        type: "input",
        name: "hair_color",
        label: { en: "Hair color", ro: "Culoarea părului" },
        span: 1,
      },
      {
        type: "input",
        name: "hair_type",
        label: { en: "Hair type", ro: "Tip de păr" },
        span: 1,
        placeholder: "e.g. Straight, Curly",
      },
    ],
  },
];

// ─── Field tabs (used in detail view) ────────────────────────────────────────

export const relationsFieldTabs: FieldTabConfig<RelationFormValues>[] = [
  {
    value: "contact",
    label: "Contact",
    sections: contactSections,
  },
  {
    value: "profile",
    label: "Profile image",
    sections: profileSections,
  },
  {
    value: "physical",
    label: "Physical",
    sections: physicalSections,
  },
];

// ─── Add tabs (field tabs on add form — no list tabs) ────────────────────────

export const relationsAddTabs: FieldTabConfig<RelationFormValues>[] = [
  {
    value: "contact",
    label: "Contact",
    sections: [
      {
        cols: 2,
        fields: [
          {
            type: "input",
            name: "email",
            label: { en: "Email", ro: "Email" },
            span: 2,
            inputType: "email",
            placeholder: "Email address",
          },
          {
            type: "input",
            name: "phone",
            label: { en: "Phone", ro: "Telefon" },
            span: 1,
            inputType: "tel",
            placeholder: "Phone number",
          },
        ],
      },
    ],
  },
  {
    value: "profile",
    label: "Profile image",
    sections: profileSections,
  },
  {
    value: "physical",
    label: "Physical",
    sections: physicalSections,
  },
];
