import type { TabConfig } from "@/framework/types/tab-config-type";
import type { user } from "@/db/schema";
import { UserFormValues } from "./schema";

export const userTabs: TabConfig<typeof user.$inferSelect, UserFormValues>[] = [
  {
    type: "relation",
    value: "groups",
    label: { en: "Groups", ro: "Grupuri" },
    relationKey: "groups",
  },
];
