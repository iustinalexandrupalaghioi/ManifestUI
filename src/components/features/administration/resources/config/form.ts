import type {
  FieldConfig,
  FormConfig,
} from "@/framework/components/form/types/types";
import type { ResourceFormValues } from "./schema";
import { ResourceType } from "@/app/types/administration/Resource";

function identityFields(readonly: boolean): FieldConfig<ResourceFormValues>[] {
  return [
    { type: "input", name: "name", label: "Name", readonly },
    {
      type: "select",
      name: "type",
      label: "Type",
      options: ResourceType.options,
      readonly,
    },
    {
      type: "input",
      name: "parent_resource_id",
      label: "Parent resource",
      inputType: "number",
      hidden: (v) => v?.type !== "action",
      readonly,
      ...(readonly
        ? {}
        : {
            pickup: {
              resource: "resources",
              mapField: "id",
              targetField: "parent_resource_id",
              preFilters: [
                { columnName: "type", operator: "equals", value: "resource" },
              ],
            },
          }),
    },
  ];
}

const restFields: FieldConfig<ResourceFormValues>[] = [
  { type: "input", name: "label", label: "Label" },
  {
    type: "input",
    name: "singular_label",
    label: "Singular label",
    hidden: (v) => v?.type !== "resource",
  },
  {
    type: "input",
    name: "table_name",
    label: "Table name",
    hidden: (v) => v?.type !== "resource",
  },
  {
    type: "textarea",
    name: "description",
    label: "Description",
    maxRows: 4,
  },
];

export const resourcesAddForm: FormConfig<ResourceFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 1,
        fields: [...identityFields(false), ...restFields],
      },
    ],
  },
  className: "max-w-lg",
};

export const resourcesForm: FormConfig<ResourceFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 1,
        fields: [...identityFields(true), ...restFields],
      },
    ],
  },
  className: "max-w-lg",
};
