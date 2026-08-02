import type { TabConfig } from "@/framework/types/tab-config-type";
import type { Relation } from "@/app/types/main/Relation";
import { relationsFieldTabs } from "./form";
import type { RelationFormValues } from "./schema";

export const relationsTabs: TabConfig<Relation, RelationFormValues>[] = [
  {
    type: "relation",
    value: "todos",
    label: "To do's",
    relationKey: "todos",
  },

  ...relationsFieldTabs.map((tab) => ({ ...tab, type: "fields" as const })),
];
