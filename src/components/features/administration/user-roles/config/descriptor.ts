import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
const id = "user-roles";

export const userRolesDescriptor: ResourceDescriptor = {
  id,
  table: "user_roles",
  singular: { en: "User role", ro: "Rol utilizator" },
  singularDefinite: { en: "user role", ro: "rolul utilizator" },
  plural: { en: "User roles", ro: "Roluri utilizator" },
  new: { en: "User role", ro: "Rol utilizator" },
  gender: "neuter",
  noun: "user role",
  queryKey: [id],
  routes: {
    list: `/${id}`,
    add: `/${id}/add`,
    detail: (rowId: string) => `/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "User roles", ro: "Roluri utilizator" },
};
