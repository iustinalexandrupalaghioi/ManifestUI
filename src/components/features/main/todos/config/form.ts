import type { FormConfig } from "@/framework/components/form/types/types";
import { Gender } from "@/app/types/main/Relation";
import type { TodoFormValues } from "./schema";

export const todosForm: FormConfig<TodoFormValues> = {
  layout: {
    mode: "grid",
    cols: 3,
    areas: `"left right notes"`,
    columns: [
      {
        column: "left",
        sections: [
          {
            cols: 1,
            fields: [
              { type: "readonly", name: "id", label: { en: "Id", ro: "Id" } },
              {
                type: "textarea",
                name: "title",
                label: { en: "Title", ro: "Titlu" },
                maxRows: 5,
              },
              {
                type: "switch",
                name: "completed",
                label: { en: "Completed", ro: "Finalizat" },
              },
            ],
          },
        ],
      },
      {
        column: "right",
        sections: [
          {
            cols: 3,
            fields: [
              {
                type: "input",
                name: "user_id",
                label: { en: "User", ro: "Utilizator" },
                inputType: "number",
                span: 1,
                pickup: {
                  resource: "relations",
                  mapField: "id",
                  targetField: "user_id",
                  embeddedField: "relation",

                  fillFields: [
                    {
                      from: "username",
                      label: { en: "Username", ro: "Nume utilizator" },
                      span: 2,
                      readonly: true,
                    },
                    {
                      from: "gender",
                      label: { en: "Gender", ro: "Gen" },
                      type: "select",
                      options: Gender.options,
                      span: 1,
                      readonly: true,
                    },
                    {
                      from: "email",
                      label: { en: "Email", ro: "Email" },
                      span: 2,
                      readonly: true,
                    },
                    {
                      from: "age",
                      label: { en: "Age", ro: "Vârstă" },
                      span: 1,
                      readonly: true,
                    },
                  ],
                },
              },
            ],
          },
        ],
      },
      {
        column: "notes",
        sections: [
          {
            cols: 1,
            fields: [
              {
                type: "textarea",
                name: "notes",
                label: { en: "Notes", ro: "Note" },
                maxRows: 5,
                hidden: (item) => !item?.completed,
              },
            ],
          },
        ],
      },
    ],
  },
  className: "max-w-full",
};
