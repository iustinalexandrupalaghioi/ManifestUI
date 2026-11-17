import type { FormConfig } from "@/framework/components/form/types/types";
import { currentUserId } from "@/framework/authorization/cache/currentUserId";
import { UserAvatarField } from "../UserAvatarField";
import type { UserFormValues } from "./schema";

export const usersForm: FormConfig<UserFormValues> = {
  layout: {
    mode: "free",
    root: {
      type: "grid",
      cols: { base: 1, lg: 4 },
      areas: {
        base: '"fields" "avatar"',
        lg: '"fields fields fields avatar"',
      },
      children: [
        {
          type: "grid",
          area: "fields",
          cols: { base: 1, sm: 2 },
          children: [
            { type: "readonly", name: "id", label: { en: "Id", ro: "Id" }, dataType: "text" },
            {
              type: "readonly",
              name: "fullName",
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
              name: "createdAt",
              label: { en: "Signed up", ro: "Înregistrat" },
              dataType: "datetime",
            },
            {
              type: "readonly",
              name: "lastSignInAt",
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
        {
          type: "custom",
          name: "avatar",
          area: "avatar",
          render: (item) => <UserAvatarField item={item} />,
        },
      ],
    },
  },
};
