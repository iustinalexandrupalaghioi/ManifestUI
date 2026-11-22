"use client";

import { KeyRoundIcon, ShieldCheckIcon, TagIcon, ToggleRightIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { z } from "zod";
import { describeGrant, grantOptions, isGrantableAction } from "@/framework/authorization/grants";
import { FormSwitch } from "@/framework/components/form/form-fields/FormSwitch";
import SectionCard from "@/framework/components/form/partials/SectionCard";
import { CustomCombobox } from "@/framework/components/ui/CustomCombobox";
import { defineBlockComponent, defineColumnComponent, defineFieldComponent } from "@/framework/extensions";
import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";

type Row = Record<string, unknown>;
const grantType = (row: Row) => (isGrantableAction(String(row.resourceId ?? "")) ? "action" : "resource");

/**
 * The group permissions screens (RBAC's `groupPermission` table): what a grant is, a resource's
 * read/add/update/delete or an action that's allowed or not, depends on the resource id, which
 * comes from the resource descriptors in code. Register them with the project's descriptors:
 * `...grantExtensions({ resources: resourceDescriptors })`. Studio offers them only on `table`.
 */
export function grantExtensions({
  resources,
  table = "group_permission",
}: {
  resources: readonly ResourceDescriptor[];
  /** The permissions table's database name. */
  table?: string;
}) {
  const tables = [table] as const;

  /** Picks what a group is granted: a resource or one of its actions. */
  const grantableResourceField = defineFieldComponent({
    type: "grantableResource",
    label: { en: "Grantable resource or action", ro: "Resursă sau acțiune acordabilă" },
    icon: KeyRoundIcon,
    tables,
    props: z.object({}),
    component: function GrantableResource({ value, onChange, disabled, readOnly }) {
      const locale = useLocale();
      return (
        <CustomCombobox
          items={grantOptions(resources, locale)}
          value={typeof value === "string" ? value : ""}
          onChange={(next: unknown) => onChange(next)}
          disabled={disabled}
          readOnly={readOnly}
          className="w-full"
        />
      );
    },
  });

  /** Read / Add / Modify / Delete for a resource, or Allowed for an action. */
  const grantSwitchesBlock = defineBlockComponent({
    type: "grantSwitches",
    label: { en: "Permission switches", ro: "Comutatoare de permisiuni" },
    icon: ShieldCheckIcon,
    tables,
    props: z.object({}),
    component: function GrantSwitches({ values }) {
      const t = useTranslations("GroupPermissions");
      if (grantType(values) === "action")
        return (
          <SectionCard title={t("permissions")} className="md:max-w-1/3">
            <FormSwitch name="allowed" label={t("allowed")} />
          </SectionCard>
        );
      return (
        <SectionCard title={t("permissions")} className="grid grid-cols-2 gap-4 md:max-w-1/2 md:grid-cols-4">
          <FormSwitch name="canRead" label={t("read")} />
          <FormSwitch name="canAdd" label={t("add")} />
          <FormSwitch name="canUpdate" label={t("modify")} />
          <FormSwitch name="canDelete" label={t("delete")} />
        </SectionCard>
      );
    },
  });

  /** The granted resource's readable name ("Page", "Page - Publish and unpublish"). */
  const grantResourceLabelColumn = defineColumnComponent({
    type: "grantResourceLabel",
    label: { en: "Granted resource name", ro: "Numele resursei acordate" },
    icon: TagIcon,
    tables,
    value: (row: Row, { locale }) => describeGrant(resources, String(row.resourceId ?? ""), locale),
  });

  /** Resource or Action, as a badge. */
  const grantTypeColumn = defineColumnComponent({
    type: "grantType",
    label: { en: "Grant type (resource or action)", ro: "Tipul permisiunii (resursă sau acțiune)" },
    icon: ShieldCheckIcon,
    tables,
    value: (row: Row) => grantType(row),
    options: ({ locale }) => [
      { value: "resource", label: locale === "ro" ? "Resursă" : "Resource", tone: "info" },
      { value: "action", label: locale === "ro" ? "Acțiune" : "Action", tone: "warning" },
    ],
  });

  /** A permission flag, ✓ / ✕, only where it applies (record permissions for a resource, Allowed for an action). */
  const grantFlagColumn = defineColumnComponent({
    type: "grantFlag",
    label: { en: "Permission flag (where it applies)", ro: "Permisiune (unde se aplică)" },
    icon: ToggleRightIcon,
    tables,
    props: z.object({
      flag: z.string().default("canRead").describe("The row's boolean property"),
      appliesTo: z.enum(["resource", "action"]).default("resource").describe("Where the flag applies"),
    }),
    value: (row: Row, { props }) => (grantType(row) === props.appliesTo ? !!row[props.flag] : null),
    options: ({ locale }) => [
      { value: "true", label: locale === "ro" ? "✓ Da" : "✓ Yes", tone: "success" },
      { value: "false", label: locale === "ro" ? "✕ Nu" : "✕ No", tone: "neutral" },
    ],
  });

  return [grantableResourceField, grantSwitchesBlock, grantResourceLabelColumn, grantTypeColumn, grantFlagColumn] as const;
}
