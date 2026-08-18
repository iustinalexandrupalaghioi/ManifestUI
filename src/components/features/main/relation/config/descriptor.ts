import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";
const id = "relations";

export const relationsDescriptor: ResourceDescriptor = {
  id,
  table: "relation",
  singular: { en: "Relation", ro: "Relație" },
  singularDefinite: { en: "relation", ro: "relația" },
  plural: { en: "Relations", ro: "Relații" },
  new: { en: "Relation", ro: "Relație" },
  gender: "feminine",
  noun: "relation",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Relations", ro: "Relații" },
};
