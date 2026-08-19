import { useTranslations } from "next-intl";
import type { FormConfig } from "@/framework/components/form/types/types";
import type { GroupPermissionFormValues } from "./schema";
import { FormSwitch } from "@/framework/components/form/form-fields/FormSwitch";
import SectionCard from "@/framework/components/form/partials/SectionCard";
import { grantableResourceOptions } from "@/app/[locale]/cms/grantablePermissions";

const isAction = (values?: Record<string, unknown>) =>
  typeof values?.resource_id === "string" && values.resource_id.includes(":");
const isNotAction = (values?: Record<string, unknown>) => !isAction(values);

function ResourcePermissionsCard() {
  const t = useTranslations("GroupPermissions");
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
  const t = useTranslations("GroupPermissions");
  return (
    <SectionCard title={t("permissions")} className="md:max-w-1/3">
      <FormSwitch name="allowed" label={t("allowed")} />
    </SectionCard>
  );
}

export const groupPermissionsForm: FormConfig<GroupPermissionFormValues> = {
  layout: {
    mode: "stack",
    sections: [
      {
        cols: 3,
        fields: [
          {
            type: "input",
            name: "group_id",
            label: { en: "Group", ro: "Grup" },
            inputType: "number",

            pickup: {
              resource: "groups",
              mapField: "id",
              targetField: "group_id",
              embeddedField: "group",
              fillFields: [
                {
                  from: "name",
                  label: { en: "Group name", ro: "Nume grup" },
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
        fields: [
          {
            type: "switch",
            name: "can_read",
            label: { en: "Read", ro: "Citire" },
            hidden: isAction,
          },
          {
            type: "switch",
            name: "can_add",
            label: { en: "Add", ro: "Adăugare" },
            hidden: isAction,
          },
          {
            type: "switch",
            name: "can_update",
            label: { en: "Modify", ro: "Modificare" },
            hidden: isAction,
          },
          {
            type: "switch",
            name: "can_delete",
            label: { en: "Delete", ro: "Ștergere" },
            hidden: isAction,
          },
        ],
      },
      {
        type: "custom",
        name: "action-permissions",
        hidden: isNotAction,
        render: () => <ActionPermissionsCard />,
        fields: [
          {
            type: "switch",
            name: "allowed",
            label: { en: "Allowed", ro: "Permis" },
            hidden: isNotAction,
          },
        ],
      },
    ],
  },
  className: "max-w-3xl",
};
