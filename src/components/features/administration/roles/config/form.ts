import type { FormConfig } from "@/framework/components/form/types/types";
import type { RoleFormValues } from "./schema";

export const rolesForm: FormConfig<RoleFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 1,
        fields: [
          { type: "readonly", name: "id", label: "Id" },
          { type: "input", name: "name", label: "Name" },
          {
            type: "textarea",
            name: "description",
            label: "Description",
            maxRows: 4,
          },
        ],
      },
    ],
  },
  className: "max-w-lg",
};
