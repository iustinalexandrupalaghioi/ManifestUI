"use client";

import { useTranslations } from "next-intl";
import type { MenuSection } from "@/framework/components/menu/types";
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
          path: "/todos",
          title: t("todosDescription"),
          icon: ListChecksIcon,
        },
        {
          type: "link",
          name: t("attachments"),
          path: "/attachments",
          title: t("attachmentsDescription"),
          icon: PaperclipIcon,
        },
        {
          type: "link",
          name: t("relations"),
          path: "/relations",
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
          path: "/users",
          title: t("usersDescription"),
          icon: UserIcon,
        },
        {
          type: "link",
          name: t("roles"),
          path: "/roles",
          title: t("rolesDescription"),
          icon: ShieldCheckIcon,
        },
      ],
    },
  ];
}
