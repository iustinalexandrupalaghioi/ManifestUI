import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";

const id = "content-drafts";

export const contentDraftsDescriptor: ResourceDescriptor = {
  id,
  table: "content_draft",
  singular: { en: "Draft", ro: "Ciornă" },
  singularDefinite: { en: "draft", ro: "ciorna" },
  plural: { en: "Drafts", ro: "Ciorne" },
  new: { en: "Draft", ro: "Ciornă" },
  gender: "feminine",
  noun: "draft",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Unpublished changes", ro: "Modificări nepublicate" },
  actions: [
    {
      key: "discard",
      label: { en: "Discard draft", ro: "Renunță la ciornă" },
      destructive: true,
      confirm: {
        en: "The unpublished changes are lost; the published version stays live.",
        ro: "Modificările nepublicate se pierd; versiunea publicată rămâne live.",
      },
    },
  ],
};
