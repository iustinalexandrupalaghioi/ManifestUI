import type { FormConfig } from "@/framework/components/form/types/types"

import { BUCKET } from "./constants"
import type { AttachmentFormValues } from "./schema"

export const attachmentsForm: FormConfig<AttachmentFormValues> = {
  layout: {
    mode: "grid",
    cols: 2,
    areas: `"left right"`,
    columns: [
      {
        column: "left",
        sections: [
          {
            cols: 3,
            fields: [
              { type: "readonly", name: "id", label: "Id", span: 1 },
              {
                type: "input",
                name: "filename",
                label: "Filename",
                span: 2,
                placeholder: "Filename",
              },
            ],
          },
          {
            cols: 3,
            fields: [
              {
                type: "input",
                name: "todo_id",
                label: "Todo",
                inputType: "number",
                span: 1,
                pickup: {
                  resource: "todos",
                  mapField: "id",
                  targetField: "todo_id",
                  embeddedField: "todos",
                  fillFields: [
                    {
                      from: "completed",
                      label: "Completed",
                      type: "switch",
                      span: 1,
                      readonly: true,
                    },
                    {
                      from: "title",
                      label: "Title",
                      type: "textarea",
                      span: 3,
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
        column: "right",
        sections: [
          {
            cols: 1,
            fields: [
              {
                type: "file",
                name: "path",
                label: "File",
                bucket: BUCKET,
                maxSize: 50 * 1024 * 1024,
              },
            ],
          },
        ],
      },
    ],
  },
}
