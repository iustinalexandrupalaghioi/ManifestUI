"use client";

import { useTranslations } from "next-intl";
import type { MenuSection } from "@/framework/components/menu/types";
import { BASE_ROUTE } from "@/components/cms/constants";
import { useResourceCount } from "@/framework/components/menu/useResourceCount";
import {
  ListChecksIcon,
  PaperclipIcon,
  Contact2Icon,
  UserIcon,
  ShieldCheckIcon,
  FileTextIcon,
  PanelsTopLeftIcon,
  BriefcaseIcon,
  InfoIcon,
  FilePenLineIcon,
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
      module: t("content"),
      links: [
        {
          type: "live",
          name: t("sitePages"),
          useLiveNumber: () => useResourceCount("site-pages"),
          path: `${BASE_ROUTE}/site-pages`,
          title: t("sitePagesDescription"),
          icon: FileTextIcon,
        },
        {
          type: "live",
          name: t("services"),
          useLiveNumber: () => useResourceCount("services"),
          path: `${BASE_ROUTE}/services`,
          title: t("servicesDescription"),
          icon: BriefcaseIcon,
        },
        {
          type: "live",
          name: t("contentDrafts"),
          useLiveNumber: () => useResourceCount("content-drafts"),
          path: `${BASE_ROUTE}/content-drafts`,
          title: t("contentDraftsDescription"),
          icon: FilePenLineIcon,
        },
      ],
    },
    {
      // Single entries open straight to their form: no list, no Add or Delete.
      module: t("singleEntries"),
      links: [
        {
          type: "link",
          name: t("navigation"),
          path: `${BASE_ROUTE}/site-settings`,
          title: t("navigationDescription"),
          icon: PanelsTopLeftIcon,
        },
        {
          type: "link",
          name: t("siteInfo"),
          path: `${BASE_ROUTE}/site-info`,
          title: t("siteInfoDescription"),
          icon: InfoIcon,
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
