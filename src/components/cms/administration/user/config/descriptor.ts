import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";
const id = "users";

export const usersDescriptor: ResourceDescriptor = {
  id,
  table: "user",
  singular: { en: "User", ro: "Utilizator" },
  singularDefinite: { en: "user", ro: "utilizatorul" },
  plural: { en: "Users", ro: "Utilizatori" },
  new: { en: "User", ro: "Utilizator" },
  gender: "masculine",
  noun: "user",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Users", ro: "Utilizatori" },
};
