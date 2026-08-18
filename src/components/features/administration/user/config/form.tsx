import type { FormConfig } from "@/framework/components/form/types/types";
import { currentUserId } from "@/framework/authorization/cache/currentUserId";
import { UserAvatarField } from "../UserAvatarField";
import type { UserFormValues } from "./schema";

export const usersForm: FormConfig<UserFormValues> = {
  layout: {
    mode: "grid",
    cols: 4,
    areas: `"fields fields fields avatar"`,
    columns: [
      {
        column: "fields",
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
                type: "readonly",
                name: "last_sign_in_at",
                label: { en: "Last sign in", ro: "Ultima autentificare" },
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
      {
        column: "avatar",
        sections: [
          {
            type: "custom",
            name: "avatar",
            render: (item) => <UserAvatarField item={item} />,
          },
        ],
      },
    ],
  },
};
