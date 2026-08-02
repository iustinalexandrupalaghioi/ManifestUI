import type { TabConfig } from "@/framework/types/tab-config-type";
import type { Role } from "@/app/types/administration/Role";
import type { RoleFormValues } from "./schema";

export const rolesTabs: TabConfig<Role, RoleFormValues>[] = [
  {
    type: "relation",
    value: "permissions",
    label: "Permissions",
    relationKey: "permissions",
  },
  {
    type: "relation",
    value: "users",
    label: "Users",
    relationKey: "users",
  },
];
