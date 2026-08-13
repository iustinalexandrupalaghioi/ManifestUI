import { resourceDescriptors } from "./resourceDescriptors";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { Enum } from "@/framework/types/global/Enum";

export interface GrantableAction {
  id: string;
  parentId: string;
  label: TranslatableText;
}

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

export function describeGrantResource(resourceId: string): string {
  const asAction = grantableActions.find((a) => a.id === resourceId);
  if (asAction) {
    return `${parentResourceLabel(asAction.parentId)} - ${resolveLabel(asAction.label, "en")}`;
  }
  const asResource = resourceDescriptors.find((d) => d.id === resourceId);
  if (asResource) return resolveLabel(asResource.singular, "en");
  return resourceId;
}

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
