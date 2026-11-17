import type { FormConfig } from "@/framework/components/form/types/types";
import type { TodoFormValues } from "./schema";

export const todosForm: FormConfig<TodoFormValues> = {
  layout: {
    mode: "free",
    root: {
      type: "grid",
      cols: { base: 1, sm: 6, md: 12 },
      gap: 4,
      children: [
        {
          type: "grid",
          cols: { base: 1, sm: 6, md: 12 },
          gap: 4,
          span: { base: 1, sm: 3, md: 6, lg: 6, xl: 6 },
          children: [
            {
              type: "grid",
              cols: { base: 1, sm: 6, md: 12 },
              gap: 4,
              span: { base: 1, sm: 6, md: 12, lg: 12, xl: 12 },
              children: [
                {
                  type: "readonly",
                  name: "id",
                  label: { en: "Id", ro: "Id" },
                  dataType: "number",
                  span: { base: 1, sm: 2, md: 4, lg: 4, xl: 4 },
                },
                {
                  type: "textarea",
                  name: "title",
                  label: { en: "Title", ro: "Title" },
                  maxRows: 5,
                  span: { base: 1, sm: 5, md: 10, lg: 10, xl: 10 },
                },
                {
                  type: "switch",
                  name: "completed",
                  label: { en: "Completed", ro: "Completed" },
                  span: { base: 1, sm: 1, md: 2, lg: 2, xl: 2 },
                },
              ],
            },
          ],
        },
        {
          type: "grid",
          cols: { base: 1, sm: 6, md: 12 },
          gap: 4,
          span: { base: 1, sm: 3, md: 6, lg: 6, xl: 6 },
          children: [
            {
              type: "grid",
              span: { base: 1, sm: 6, md: 12, lg: 12, xl: 12 },
              cols: { base: 1, sm: 6, md: 12 },
              children: [
                {
                  type: "input",
                  name: "user_id",
                  label: { en: "User", ro: "User" },
                  inputType: "number",
                  span: { base: 1, sm: 2, md: 4, lg: 4, xl: 4 },
                  pickup: {
                    resource: "relations",
                    mapField: "id",
                    targetField: "user_id",
                    fillDisplay: "none",
                  },
                },
              ],
            },
            {
              type: "pickupvalue",
              target: "user_id",
              from: "first_name",
              label: { en: "First name", ro: "First name" },
              span: { base: 1, sm: 3, md: 6, lg: 6, xl: 6 },
            },
            {
              type: "pickupvalue",
              target: "user_id",
              from: "last_name",
              label: { en: "Last name", ro: "Last name" },
              span: { base: 1, sm: 3, md: 6, lg: 6, xl: 6 },
            },
          ],
        },
      ],
    },
  },
  className: "max-w-full",
};
