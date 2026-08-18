import type { FormConfig } from "@/framework/components/form/types/types";
import { currentUserId } from "@/framework/authorization/cache/currentUserId";
import type { UserFormValues } from "./schema";

export const usersForm: FormConfig<UserFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 2,
        fields: [
          { type: "readonly", name: "id", label: { en: "Id", ro: "Id" }, dataType: "text" },
          {
            type: "readonly",
            name: "full_name",
            label: { en: "Full name", ro: "Nume complet" },
            dataType: "text",
          },
          {
            type: "readonly",
            name: "email",
            label: { en: "Email", ro: "Email" },
            dataType: "text",
          },
          {
            type: "readonly",
            name: "phone",
            label: { en: "Phone", ro: "Telefon" },
            dataType: "text",
          },
          {
            type: "readonly",
            name: "created_at",
            label: { en: "Signed up", ro: "Înregistrat" },
            dataType: "datetime",
          },
          {
            type: "switch",
            name: "administrator",
            label: { en: "Administrator", ro: "Administrator" },
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
