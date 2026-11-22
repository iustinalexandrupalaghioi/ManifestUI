import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";

const id = "site-settings";

export const siteSettingsDescriptor: ResourceDescriptor = {
  id,
  table: "site_settings",
  singular: { en: "Navigation", ro: "Navigație" },
  singularDefinite: { en: "navigation", ro: "navigația" },
  plural: { en: "Navigation", ro: "Navigație" },
  new: { en: "Navigation", ro: "Navigație" },
  gender: "feminine",
  noun: "navigation",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Navigation", ro: "Navigație" },
  content: { type: "navigation", kind: "singleton", localized: true },
};
