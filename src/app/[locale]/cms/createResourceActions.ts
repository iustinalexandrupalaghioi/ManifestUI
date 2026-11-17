import "server-only";
import { createResourceActions as createResourceActionsBase } from "@/framework/lib/transactionalAction";
import { refreshResource } from "@/modules/site/server";
import { resourceDescriptors } from "./resourceDescriptors";

/**
 * CRUD entries for a resource's server actions. Once a save commits, website
 * pages showing the resource (collections with `resource: resourceId`) refresh.
 */
export function createResourceActions(resourceId: string) {
  return createResourceActionsBase(resourceId, resourceDescriptors, { onCommit: refreshResource });
}
