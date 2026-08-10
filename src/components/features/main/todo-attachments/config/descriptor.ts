import type { ResourceDescriptor } from "@/framework/types/resource-descriptor-type";
import { BASE_ROUTE } from "@/components/constants";
const id = "attachments";

export const attachmentsDescriptor: ResourceDescriptor = {
  id,
  table: "todo_attachments",
  singular: { en: "Attachment", ro: "Atașament" },
  plural: { en: "Attachments", ro: "Atașamente" },
  new: { en: "Attachment", ro: "Atașament" },
  gender: "neuter",
  noun: "attachment",
  queryKey: [id],
  routes: {
    list: `${BASE_ROUTE}/${id}`,
    add: `${BASE_ROUTE}/${id}/add`,
    detail: (rowId: string) => `${BASE_ROUTE}/${id}/${rowId}`,
  },
  overviewKey: `${id}-overview`,
  defaultViewName: { en: "Attachments", ro: "Atașamente" },
};
