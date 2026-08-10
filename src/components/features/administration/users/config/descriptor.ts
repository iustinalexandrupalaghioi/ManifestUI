import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
const id = "users";

export const usersDescriptor: ResourceDescriptor = {
  id,
  table: "users",
  singular: { en: "User", ro: "Utilizator" },
  singularDefinite: { en: "user", ro: "utilizatorul" },
  plural: { en: "Users", ro: "Utilizatori" },
  new: { en: "User", ro: "Utilizator" },
  gender: "masculine",
  noun: "user",
  queryKey: [id],
  routes: {
    list: `/${id}`,
    add: `/${id}/add`,
    detail: (rowId: string) => `/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Users", ro: "Utilizatori" },
};
