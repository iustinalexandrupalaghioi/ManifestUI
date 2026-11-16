import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";
const id = "site-pages";

export const sitePagesDescriptor: ResourceDescriptor = {
  id,
  table: "site_page",
  singular: { en: "Site page", ro: "Pagină de site" },
  singularDefinite: { en: "site page", ro: "pagina de site" },
  plural: { en: "Site pages", ro: "Pagini de site" },
  new: { en: "Site page", ro: "Pagină de site" },
  gender: "feminine",
  noun: "site page",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Site pages", ro: "Pagini de site" },
};
