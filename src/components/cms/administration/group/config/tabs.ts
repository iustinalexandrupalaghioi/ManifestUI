import type { TabConfig } from "@/framework/types/tab-config-type";
import type { group } from "@/db/schema";
import type { GroupFormValues } from "./schema";

export const groupsTabs: TabConfig<
  typeof group.$inferSelect,
  GroupFormValues
>[] = [
  {
    type: "relation",
    value: "permissions",
    label: { en: "Permissions", ro: "Permisiuni" },
    relationKey: "permissions",
  },
  {
    type: "relation",
    value: "users",
    label: { en: "Users", ro: "Utilizatori" },
    relationKey: "users",
  },
];
