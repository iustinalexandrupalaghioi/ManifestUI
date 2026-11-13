"use client";

import { useTranslations } from "next-intl";
import type { MenuSection } from "@/framework/components/menu/types";
import { BASE_ROUTE } from "@/components/cms/constants";
import {
  ListChecksIcon,
  PaperclipIcon,
  Contact2Icon,
  UserIcon,
  ShieldCheckIcon,
} from "lucide-react";

export function useMenuItems(): MenuSection[] {
  const t = useTranslations("Menu");

  return [
    {
      module: t("main"),
      links: [
        {
          type: "link",
          name: t("todos"),
          path: `${BASE_ROUTE}/todos`,
          title: t("todosDescription"),
          icon: ListChecksIcon,
        },
        {
          type: "link",
          name: t("attachments"),
          path: `${BASE_ROUTE}/attachments`,
          title: t("attachmentsDescription"),
          icon: PaperclipIcon,
        },
        {
          type: "link",
          name: t("relations"),
          path: `${BASE_ROUTE}/relations`,
          title: t("relationsDescription"),
          icon: Contact2Icon,
        },
      ],
    },
    {
      module: t("administration"),
      links: [
        {
          type: "link",
          name: t("users"),
          path: `${BASE_ROUTE}/users`,
          title: t("usersDescription"),
          icon: UserIcon,
        },
        {
          type: "link",
          name: t("groups"),
          path: `${BASE_ROUTE}/groups`,
          title: t("groupsDescription"),
          icon: ShieldCheckIcon,
        },
      ],
    },
  ];
}
