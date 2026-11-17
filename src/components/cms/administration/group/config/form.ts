import type { FormConfig } from "@/framework/components/form/types/types";
import type { GroupFormValues } from "./schema";

export const groupsForm: FormConfig<GroupFormValues> = {
  layout: {
    mode: "free",
    root: {
      type: "column",
      children: [
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
  },
  className: "max-w-lg",
};
