import type { FormConfig } from "@/framework/components/form/types/types";
import type { UserRoleFormValues } from "./schema";

export const userRolesForm: FormConfig<UserRoleFormValues> = {
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
            name: "role_id",
            label: { en: "Role", ro: "Rol" },
            inputType: "number",
            pickup: {
              resource: "roles",
              mapField: "id",
              targetField: "role_id",
              fillFields: [
                {
                  from: "name",
                  label: { en: "Role", ro: "Rol" },
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
