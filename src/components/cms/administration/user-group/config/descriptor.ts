import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";
const id = "user-groups";

export const userGroupsDescriptor: ResourceDescriptor = {
  id,
  table: "user_group",
  singular: { en: "User group", ro: "Grup utilizator" },
  singularDefinite: { en: "user group", ro: "grupul utilizator" },
  plural: { en: "User groups", ro: "Grupuri utilizator" },
  new: { en: "User group", ro: "Grup utilizator" },
  gender: "neuter",
  noun: "user group",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "User groups", ro: "Grupuri utilizator" },
};
