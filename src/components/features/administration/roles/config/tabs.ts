import type { TabConfig } from "@/framework/types/tab-config-type";
import type { Role } from "@/app/types/administration/Role";
import type { RoleFormValues } from "./schema";

export const rolesTabs: TabConfig<Role, RoleFormValues>[] = [
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
