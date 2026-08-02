import type { FormConfig } from "@/framework/components/form/types/types";
import type { RolePermissionFormValues } from "./schema";
import { FormSwitch } from "@/framework/components/form/form-fields/FormSwitch";
import SectionCard from "@/framework/components/form/partials/SectionCard";
import { ResourceType } from "@/app/types/administration/Resource";

const isAction = (values?: Record<string, unknown>) =>
  values?.resource_type === "action";
const isNotAction = (values?: Record<string, unknown>) =>
  values?.resource_type !== "action";

export const rolePermissionsForm: FormConfig<RolePermissionFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 3,
        fields: [
          {
            type: "input",
            name: "role_id",
            label: "Role",
            inputType: "number",

            pickup: {
              resource: "roles",
              mapField: "id",
              targetField: "role_id",
              embeddedField: "role",
              fillFields: [
                {
                  from: "name",
                  label: "Role name",
                  readonly: true,
                  span: 2,
                },
              ],
            },
          },
          {
            type: "input",
            name: "resource_id",
            label: "Resource",
            pickup: {
              resource: "resources",
              mapField: "id",
              targetField: "resource_id",
              embeddedField: "resource",
              fillFields: [
                {
                  from: "type",
                  label: "Resource type",
                  type: "select",
                  options: ResourceType.options,
                  readonly: true,
                  span: 2,
                },
                {
                  from: "type",
                  to: "resource_type",
                },
              ],
            },
          },
        ],
      },
      {
        type: "custom",
        name: "resource-permissions",
        hidden: isAction,
        render: () => (
          <SectionCard
            title="Permissions"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 md:max-w-1/2"
          >
            <FormSwitch name="can_read" label="Read" />
            <FormSwitch name="can_add" label="Add" />
            <FormSwitch name="can_update" label="Modify" />
            <FormSwitch name="can_delete" label="Delete" />
          </SectionCard>
        ),
      },
      {
        type: "custom",
        name: "action-permissions",
        hidden: isNotAction,
        render: () => (
          <SectionCard title="Permissions" className="md:max-w-1/3">
            <FormSwitch name="allowed" label="Allowed" />
          </SectionCard>
        ),
      },
    ],
  },
  className: "max-w-3xl",
};
