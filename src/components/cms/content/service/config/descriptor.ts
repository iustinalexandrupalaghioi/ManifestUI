import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";
const id = "services";

export const servicesDescriptor: ResourceDescriptor = {
  id,
  table: "service",
  singular: { en: "Service", ro: "Serviciu" },
  singularDefinite: { en: "service", ro: "serviciul" },
  plural: { en: "Services", ro: "Servicii" },
  new: { en: "Service", ro: "Serviciu" },
  gender: "neuter",
  noun: "service",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Services", ro: "Servicii" },
};
