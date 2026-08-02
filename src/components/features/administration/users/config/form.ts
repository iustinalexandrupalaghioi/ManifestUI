import type { FormConfig } from "@/framework/components/form/types/types";
import { currentUserId } from "@/framework/authorization/useCurrentUserId";
import type { UserFormValues } from "./schema";

export const usersForm: FormConfig<UserFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 2,
        fields: [
          { type: "readonly", name: "id", label: "Id", dataType: "text" },
          {
            type: "readonly",
            name: "full_name",
            label: "Full name",
            dataType: "text",
          },
          {
            type: "readonly",
            name: "email",
            label: "Email",
            dataType: "text",
          },
          {
            type: "readonly",
            name: "phone",
            label: "Phone",
            dataType: "text",
          },
          {
            type: "readonly",
            name: "created_at",
            label: "Signed up",
            dataType: "datetime",
          },
          {
            type: "switch",
            name: "administrator",
            label: "Administrator",
            // An administrator must not be able to strip their own admin
            // flag — that's enforced server-side in updateUser, but
            // disabling the field here avoids showing a control that would
            // just be rejected on submit.
            disabled: (item) => item?.id === currentUserId(),
          },
        ],
      },
    ],
  },
};
