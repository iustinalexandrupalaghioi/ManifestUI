import { createEnum } from "@/framework/lib/utils";

export interface Resource {
  id: number;
  name: string;
  parent_resource_id: number | null;
  type: ResourceType;
  label: string;
  singular_label: string | null;
  table_name: string | null;
  description: string | null;
  created_at: string | null;
  parent?: { id: number; name: string } | null;
}

export const ResourceType = createEnum({
  resource: "Resource",
  action: "Action",
});

export type ResourceType = keyof typeof ResourceType.labels;
