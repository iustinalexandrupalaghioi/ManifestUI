import type { TabConfig } from "@/framework/types/tab-config-type";
import type { Group } from "@/app/types/administration/Group";
import type { GroupFormValues } from "./schema";

export const groupsTabs: TabConfig<Group, GroupFormValues>[] = [
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
