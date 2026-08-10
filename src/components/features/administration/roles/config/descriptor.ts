import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
const id = "roles";

export const rolesDescriptor: ResourceDescriptor = {
  id,
  table: "roles",
  singular: { en: "Role", ro: "Rol" },
  plural: { en: "Roles", ro: "Roluri" },
  new: { en: "Role", ro: "Rol" },
  gender: "neuter",
  noun: "role",
  queryKey: [id],
  routes: {
    list: `/${id}`,
    add: `/${id}/add`,
    detail: (rowId: string) => `/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Roles", ro: "Roluri" },
};
