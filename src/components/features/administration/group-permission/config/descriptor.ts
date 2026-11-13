import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";
const id = "group-permissions";

export const groupPermissionsDescriptor: ResourceDescriptor = {
  id,
  table: "group_permission",
  singular: { en: "Group permission", ro: "Permisiune grup" },
  singularDefinite: { en: "group permission", ro: "permisiunea grup" },
  plural: { en: "Group permissions", ro: "Permisiuni grup" },
  new: { en: "Group permission", ro: "Permisiune grup" },
  gender: "feminine",
  noun: "group permission",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Group permissions", ro: "Permisiuni grup" },
};
