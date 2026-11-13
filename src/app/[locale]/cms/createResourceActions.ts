import "server-only";
import { createResourceActions as createResourceActionsBase } from "@/framework/lib/transactionalAction";
import { resourceDescriptors } from "./resourceDescriptors";

export function createResourceActions(resourceId: string) {
  return createResourceActionsBase(resourceId, resourceDescriptors);
}
