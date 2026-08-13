import { useTranslations } from "next-intl";
import type { FormConfig } from "@/framework/components/form/types/types";
import type { RolePermissionFormValues } from "./schema";
import { FormSwitch } from "@/framework/components/form/form-fields/FormSwitch";
import SectionCard from "@/framework/components/form/partials/SectionCard";
import { grantableResourceOptions } from "@/app/grantablePermissions";

const isAction = (values?: Record<string, unknown>) =>
  typeof values?.resource_id === "string" && values.resource_id.includes(":");
const isNotAction = (values?: Record<string, unknown>) => !isAction(values);

function ResourcePermissionsCard() {
  const t = useTranslations("RolePermissions");
  return (
    <SectionCard
      title={t("permissions")}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 md:max-w-1/2"
    >
      <FormSwitch name="can_read" label={t("read")} />
      <FormSwitch name="can_add" label={t("add")} />
      <FormSwitch name="can_update" label={t("modify")} />
      <FormSwitch name="can_delete" label={t("delete")} />
    </SectionCard>
  );
}

function ActionPermissionsCard() {
  const t = useTranslations("RolePermissions");
  return (
    <SectionCard title={t("permissions")} className="md:max-w-1/3">
      <FormSwitch name="allowed" label={t("allowed")} />
    </SectionCard>
  );
}

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
            label: { en: "Role", ro: "Rol" },
            inputType: "number",

            pickup: {
              resource: "roles",
              mapField: "id",
              targetField: "role_id",
              embeddedField: "role",
              fillFields: [
                {
                  from: "name",
                  label: { en: "Role name", ro: "Nume rol" },
                  readonly: true,
                  span: 2,
                },
              ],
            },
          },
          {
            type: "combobox",
            name: "resource_id",
            label: { en: "Resource", ro: "Resursă" },
            options: grantableResourceOptions,
          },
        ],
      },
      {
        type: "custom",
        name: "resource-permissions",
        hidden: isAction,
        render: () => <ResourcePermissionsCard />,
      },
      {
        type: "custom",
        name: "action-permissions",
        hidden: isNotAction,
        render: () => <ActionPermissionsCard />,
      },
    ],
  },
  className: "max-w-3xl",
};
