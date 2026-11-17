import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { todosDescriptor } from "@/components/cms/main/todo/config/descriptor";
import { relationsDescriptor } from "@/components/cms/main/relation/config/descriptor";
import { attachmentsDescriptor } from "@/components/cms/main/todo-attachment/config/descriptor";
import { groupsDescriptor } from "@/components/cms/administration/group/config/descriptor";
import { groupPermissionsDescriptor } from "@/components/cms/administration/group-permission/config/descriptor";
import { userGroupsDescriptor } from "@/components/cms/administration/user-group/config/descriptor";
import { usersDescriptor } from "@/components/cms/administration/user/config/descriptor";
import { sitePagesDescriptor } from "@/components/cms/content/site-page/config/descriptor";
import { siteSettingsDescriptor } from "@/components/cms/content/site-settings/config/descriptor";
import { servicesDescriptor } from "@/components/cms/content/service/config/descriptor";

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
  sitePagesDescriptor,
  siteSettingsDescriptor,
  servicesDescriptor,
];
