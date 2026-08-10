import type { TabConfig } from "@/framework/types/tab-config-type";
import type { User } from "@/app/types/administration/User";
import { UserFormValues } from "./schema";

export const userTabs: TabConfig<User, UserFormValues>[] = [
  {
    type: "relation",
    value: "roles",
    label: { en: "Roles", ro: "Roluri" },
    relationKey: "roles",
  },
];
