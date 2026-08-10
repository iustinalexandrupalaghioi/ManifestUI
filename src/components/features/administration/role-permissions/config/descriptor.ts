import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
const id = "role-permissions";

export const rolePermissionsDescriptor: ResourceDescriptor = {
  id,
  table: "role_resource_permissions",
  singular: { en: "Role permission", ro: "Permisiune rol" },
  plural: { en: "Role permissions", ro: "Permisiuni rol" },
  new: { en: "Role permission", ro: "Permisiune rol" },
  gender: "feminine",
  noun: "role permission",
  queryKey: [id],
  routes: {
    list: `/${id}`,
    add: `/${id}/add`,
    detail: (rowId: string) => `/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Role permissions", ro: "Permisiuni rol" },
};
