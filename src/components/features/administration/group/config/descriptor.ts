import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";
const id = "groups";

export const groupsDescriptor: ResourceDescriptor = {
  id,
  table: "group",
  singular: { en: "Group", ro: "Grup" },
  singularDefinite: { en: "group", ro: "grupul" },
  plural: { en: "Groups", ro: "Grupuri" },
  new: { en: "Group", ro: "Grup" },
  gender: "neuter",
  noun: "group",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Groups", ro: "Grupuri" },
};
