import type { FormConfig } from "@/framework/components/form/types/types";
import type { RoleFormValues } from "./schema";

export const rolesForm: FormConfig<RoleFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 1,
        fields: [
          { type: "readonly", name: "id", label: { en: "Id", ro: "Id" } },
          { type: "input", name: "name", label: { en: "Name", ro: "Nume" } },
          {
            type: "textarea",
            name: "description",
            label: { en: "Description", ro: "Descriere" },
            maxRows: 4,
          },
        ],
      },
    ],
  },
  className: "max-w-lg",
};
