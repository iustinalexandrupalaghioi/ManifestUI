import type { FormConfig } from "@/framework/components/form/types/types";
import type { UserGroupFormValues } from "./schema";

export const userGroupsForm: FormConfig<UserGroupFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 1,
        fields: [
          {
            type: "input",
            name: "user_id",
            label: { en: "User", ro: "Utilizator" },
            pickup: {
              resource: "users",
              mapField: "id",
              targetField: "user_id",
              embeddedField: "user",
              fillFields: [
                { from: "email", label: { en: "Email", ro: "Email" }, readonly: true },
                { from: "full_name", label: { en: "Full name", ro: "Nume complet" }, readonly: true },
              ],
            },
          },
          {
            type: "input",
            name: "group_id",
            label: { en: "Group", ro: "Grup" },
            inputType: "number",
            pickup: {
              resource: "groups",
              mapField: "id",
              targetField: "group_id",
              fillFields: [
                {
                  from: "name",
                  label: { en: "Group", ro: "Grup" },
                  readonly: true,
                },
              ],
            },
          },
        ],
      },
    ],
  },
  className: "max-w-lg",
};
