import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/cms/constants";

const id = "content-revisions";

export const contentRevisionsDescriptor: ResourceDescriptor = {
  id,
  table: "content_revision",
  singular: { en: "Version", ro: "Versiune" },
  singularDefinite: { en: "version", ro: "versiunea" },
  plural: { en: "Versions", ro: "Versiuni" },
  new: { en: "Version", ro: "Versiune" },
  gender: "feminine",
  noun: "version",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "History", ro: "Istoric" },
  actions: [
    {
      key: "restore",
      label: { en: "Restore to draft", ro: "Restaurează în ciornă" },
      confirm: {
        en: "Restoring never goes live by itself: it becomes the draft, and you publish when ready.",
        ro: "Restaurarea nu publică nimic: devine ciorna, iar tu publici când e gata.",
      },
    },
  ],
};
