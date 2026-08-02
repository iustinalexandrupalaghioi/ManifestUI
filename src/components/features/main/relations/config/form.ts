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
            label: "Id",
            span: 1,
          },
          { type: "input", name: "username", label: "Username", span: 1 },
          { type: "input", name: "first_name", label: "First name", span: 1 },
          { type: "input", name: "last_name", label: "Last name", span: 1 },
          { type: "input", name: "maiden_name", label: "Maiden name", span: 1 },
          {
            type: "select",
            name: "gender",
            label: "Gender",
            span: 1,
            options: Gender.options,
            placeholder: "Select gender",
          },
          {
            type: "input",
            name: "age",
            label: "Age",
            span: 1,
            inputType: "number",
            min: 0,
          },
          {
            type: "date",
            name: "birth_date",
            label: "Birth date",
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
        label: "Email",
        inputType: "email",
        placeholder: "Email address",
      },
      {
        type: "input",
        name: "phone",
        label: "Phone",
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
        label: "Profile image",
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
        label: "Blood group",
        span: 1,
        placeholder: "e.g. A+",
      },
      {
        type: "input",
        name: "height",
        label: "Height (cm)",
        span: 1,
        inputType: "number",
        min: 0,
      },
      {
        type: "input",
        name: "weight",
        label: "Weight (kg)",
        span: 1,
        inputType: "number",
        min: 0,
      },
      { type: "input", name: "eye_color", label: "Eye color", span: 1 },
      { type: "input", name: "hair_color", label: "Hair color", span: 1 },
      {
        type: "input",
        name: "hair_type",
        label: "Hair type",
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
            label: "Email",
            span: 2,
            inputType: "email",
            placeholder: "Email address",
          },
          {
            type: "input",
            name: "phone",
            label: "Phone",
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
