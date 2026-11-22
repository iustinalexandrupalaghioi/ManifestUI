import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";

const id = "site-info";

export const siteInfoDescriptor: ResourceDescriptor = {
  id,
  table: "site_info",
  singular: { en: "Site info", ro: "Informații site" },
  singularDefinite: { en: "site info", ro: "informațiile site-ului" },
  plural: { en: "Site info", ro: "Informații site" },
  new: { en: "Site info", ro: "Informații site" },
  gender: "feminine",
  noun: "site info",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Site info", ro: "Informații site" },
  content: { type: "siteInfo", kind: "singleton", localized: true },
};
