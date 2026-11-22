import { DERIVED_CONTENT_RESOURCES } from "@/framework/content/revisions";
import { resolveLabel } from "@/framework/lib/resolveLabel";
import type { Enum } from "@/framework/types/global/Enum";
import type { TranslatableText } from "@/framework/types/i18n-types";
import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";

/**
 * What a group can be granted (group_permission.resource_id): a resource id ("pages", with
 * read/add/update/delete) or an action id ("pages:publish", allowed or not). Both come from the
 * resource descriptors in code, never from a table; pass the project's descriptors in.
 */
export interface GrantableAction {
  id: string;
  parentId: string;
  label: TranslatableText;
}

type Descriptors = readonly ResourceDescriptor[];

const PUBLISH: TranslatableText = { en: "Publish and unpublish", ro: "Publicare și retragere" };
const RESOURCES_GROUP: TranslatableText = { en: "Resources", ro: "Resurse" };
const ACTIONS_GROUP: TranslatableText = { en: "Actions", ro: "Acțiuni" };

/**
 * Actions granted on their own, beyond read/add/update/delete: "<resource>:publish" for every
 * content type (update saves drafts, only this makes them live), and each descriptor's custom
 * actions (toolbar buttons).
 */
export function grantableActions(resources: Descriptors): GrantableAction[] {
  return [
    ...resources
      .filter((descriptor) => descriptor.content)
      .map((descriptor) => ({ id: `${descriptor.id}:publish`, parentId: descriptor.id, label: PUBLISH })),
    ...resources
      .filter((descriptor) => !DERIVED_CONTENT_RESOURCES.includes(descriptor.id))
      .flatMap((descriptor) =>
      (descriptor.actions ?? []).map((action) => ({ id: `${descriptor.id}:${action.key}`, parentId: descriptor.id, label: action.label })),
    ),
  ];
}

/** An action id ("pages:publish") rather than a resource id. */
export function isGrantableAction(resourceId: string): boolean {
  return resourceId.includes(":");
}

/** A grant's readable name: "Page", or "Page - Publish and unpublish". */
export function describeGrant(resources: Descriptors, resourceId: string, locale: string): string {
  const singular = (id: string) => {
    const descriptor = resources.find((candidate) => candidate.id === id);
    return descriptor ? resolveLabel(descriptor.singular, locale) : undefined;
  };
  const action = grantableActions(resources).find((candidate) => candidate.id === resourceId);
  if (action) return `${singular(action.parentId) ?? action.parentId} - ${resolveLabel(action.label, locale)}`;
  return singular(resourceId) ?? resourceId;
}

/** The picker's options: every resource, then every action. */
export function grantOptions(resources: Descriptors, locale: string): Enum[] {
  return [
    // Versions and drafts aren't granted: their permissions follow the content types (src/framework/content/revisions.ts).
    ...resources
      .filter((descriptor) => !DERIVED_CONTENT_RESOURCES.includes(descriptor.id))
      .map((descriptor) => ({
        value: descriptor.id,
        label: resolveLabel(descriptor.singular, locale),
        group: resolveLabel(RESOURCES_GROUP, locale),
      })),
    ...grantableActions(resources).map((action) => ({
      value: action.id,
      label: describeGrant(resources, action.id, locale),
      group: resolveLabel(ACTIONS_GROUP, locale),
    })),
  ];
}
