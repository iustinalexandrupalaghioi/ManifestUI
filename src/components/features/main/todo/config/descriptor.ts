import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";
const id = "todos";

export const todosDescriptor: ResourceDescriptor = {
  id,
  table: "todo",
  singular: { en: "To do", ro: "Sarcină" },
  singularDefinite: { en: "to do", ro: "sarcina" },
  plural: { en: "To dos", ro: "Sarcini" },
  new: { en: "To do", ro: "Sarcină" },
  gender: "feminine",
  noun: "todo",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "To do's", ro: "Sarcini" },
};
