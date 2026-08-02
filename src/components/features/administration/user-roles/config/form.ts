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
            label: "User",
            pickup: {
              resource: "users",
              mapField: "id",
              targetField: "user_id",
              embeddedField: "user",
              fillFields: [
                { from: "email", label: "Email", readonly: true },
                { from: "full_name", label: "Full name", readonly: true },
              ],
            },
          },
          {
            type: "input",
            name: "role_id",
            label: "Role",
            inputType: "number",
            pickup: {
              resource: "roles",
              mapField: "id",
              targetField: "role_id",
              fillFields: [
                {
                  from: "name",
                  label: "Role",
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
