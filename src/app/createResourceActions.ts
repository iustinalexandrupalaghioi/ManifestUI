import "server-only";
import { createResourceActions as createResourceActionsBase } from "@/framework/lib/transactionalAction";
import { resourceDescriptors } from "./resourceDescriptors";

// Pre-binds the framework's generic createResourceActions to this project's
// resource descriptors once, so each resource's config/api.ts only needs to
// name its own resourceId — not thread the (identical, whole-app) list
// through every call site.
export function createResourceActions(resourceId: string) {
  return createResourceActionsBase(resourceId, resourceDescriptors);
}
