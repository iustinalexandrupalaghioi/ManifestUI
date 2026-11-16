import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";
const id = "site-settings";

export const siteSettingsDescriptor: ResourceDescriptor = {
  id,
  table: "site_settings",
  singular: { en: "Site settings", ro: "Setări site" },
  singularDefinite: { en: "site settings", ro: "setările site-ului" },
  plural: { en: "Site settings", ro: "Setări site" },
  new: { en: "Site settings", ro: "Setări site" },
  gender: "feminine",
  noun: "site settings",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Site settings", ro: "Setări site" },
};
