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
              { type: "readonly", name: "id", label: "Id" },
              {
                type: "textarea",
                name: "title",
                label: "Title",
                maxRows: 5,
              },
              { type: "switch", name: "completed", label: "Completed" },
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
                label: "User",
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
                      label: "Username",
                      span: 2,
                      readonly: true,
                    },
                    {
                      from: "gender",
                      label: "Gender",
                      type: "select",
                      options: Gender.options,
                      span: 1,
                      readonly: true,
                    },
                    { from: "email", label: "Email", span: 2, readonly: true },
                    { from: "age", label: "Age", span: 1, readonly: true },
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
                label: "Notes",
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
