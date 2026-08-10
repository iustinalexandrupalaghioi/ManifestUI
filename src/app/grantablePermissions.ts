import { resourceDescriptors } from "./resourceDescriptors";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { Enum } from "@/framework/types/global/Enum";

export interface GrantableAction {
  // Full permission string (e.g. "todos:complete-with-note") — also what's
  // stored in role_resource_permissions.resource_id for this kind of grant.
  id: string;
  parentId: string;
  label: TranslatableText;
}

// Custom, non-CRUD actions that can be granted via role-permissions. Kept as
// a small manually-maintained list (there's only ever been the two) rather
// than derived from each resource's bulkActions/actionForms — those are
// authored as pre-rendered ReactNode labels for in-app UI, not a resolvable
// TranslatableText suitable for a permission picker. Their `key`s (checked
// against by create-actions-hooks.ts / create-detail-page.tsx via
// hasPermission(`${id}:${action.key}`)) must match the ids below exactly —
// see src/components/features/main/todos/config/actions/{complete,
// complete-with-notes}.tsx.
export const grantableActions: GrantableAction[] = [
  {
    id: "todos:complete",
    parentId: "todos",
    label: { en: "Complete", ro: "Finalizează" },
  },
  {
    id: "todos:complete-with-note",
    parentId: "todos",
    label: { en: "Complete with note", ro: "Finalizează cu notă" },
  },
];

export function isGrantableAction(resourceId: string): boolean {
  return resourceId.includes(":");
}

function parentResourceLabel(parentId: string): string {
  const parent = resourceDescriptors.find((d) => d.id === parentId);
  return parent ? resolveLabel(parent.singular, "en") : parentId;
}

// Same English-only caveat as below — used where a grant's resource_id needs
// a human-readable label outside the ColumnConfig/FieldConfig resolution
// path (e.g. inside a static accessorFn, which has no locale in scope).
export function describeGrantResource(resourceId: string): string {
  const asAction = grantableActions.find((a) => a.id === resourceId);
  if (asAction) {
    return `${parentResourceLabel(asAction.parentId)} - ${resolveLabel(asAction.label, "en")}`;
  }
  const asResource = resourceDescriptors.find((d) => d.id === resourceId);
  if (asResource) return resolveLabel(asResource.singular, "en");
  return resourceId;
}

// English-only for now — matches every other static <select>/<combobox> in
// the app (ResourceType.options, Gender.options): SelectFieldConfig/
// ComboboxFieldConfig.options is a plain string label, authored once, not
// resolved per-locale like ColumnConfig/FieldConfig label are. Grouped into
// "Resources" (CRUD-gated, resourceDescriptors) vs "Actions" (custom
// verbs, grantableActions) — CustomCombobox renders a heading per group.
export function grantableResourceOptions(): Enum[] {
  return [
    ...resourceDescriptors.map((d) => ({
      value: d.id,
      label: resolveLabel(d.singular, "en"),
      group: "Resources",
    })),
    ...grantableActions.map((a) => ({
      value: a.id,
      label: describeGrantResource(a.id),
      group: "Actions",
    })),
  ];
}
