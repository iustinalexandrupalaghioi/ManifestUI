import type { MenuSection } from "@/framework/components/menu/types"
import {
  ListChecksIcon,
  PaperclipIcon,
  Contact2Icon,
  UserIcon,
  ShieldCheckIcon,
  LayersIcon,
} from "lucide-react"

export const menuItems: MenuSection[] = [
  {
    module: "Main",
    links: [
      {
        type: "link",
        name: "To dos",
        path: "/todos",
        title: "View all todos",
        icon: ListChecksIcon,
      },
      {
        type: "link",
        name: "Attachments",
        path: "/attachments",
        title: "View all todo attachments",
        icon: PaperclipIcon,
      },
      {
        type: "link",
        name: "Relations",
        path: "/relations",
        title: "View all relations (demo data)",
        icon: Contact2Icon,
      },
    ],
  },
  {
    module: "Administration",
    links: [
      {
        type: "link",
        name: "Users",
        path: "/users",
        title: "View signed-up users",
        icon: UserIcon,
      },
      {
        type: "link",
        name: "Roles",
        path: "/roles",
        title: "Manage roles",
        icon: ShieldCheckIcon,
      },
      {
        type: "link",
        name: "Resources",
        path: "/resources",
        title: "Manage grantable resources and actions",
        icon: LayersIcon,
      },
    ],
  },
]
