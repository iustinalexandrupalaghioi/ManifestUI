import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { todosDescriptor } from "@/components/features/main/todo/config/descriptor";
import { relationsDescriptor } from "@/components/features/main/relation/config/descriptor";
import { attachmentsDescriptor } from "@/components/features/main/todo-attachment/config/descriptor";
import { groupsDescriptor } from "@/components/features/administration/group/config/descriptor";
import { groupPermissionsDescriptor } from "@/components/features/administration/group-permission/config/descriptor";
import { userGroupsDescriptor } from "@/components/features/administration/user-group/config/descriptor";
import { usersDescriptor } from "@/components/features/administration/user/config/descriptor";

// Whole-app resource registry — fed to the framework's generic
// createResourceActions() (via ./createResourceActions) so failure messages
// (e.g. FK-reference errors) can resolve *any* resource's display label,
// not just the one the failing action belongs to.
export const resourceDescriptors: ResourceDescriptor[] = [
  todosDescriptor,
  relationsDescriptor,
  attachmentsDescriptor,
  groupsDescriptor,
  groupPermissionsDescriptor,
  userGroupsDescriptor,
  usersDescriptor,
];
