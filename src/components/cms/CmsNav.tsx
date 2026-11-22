"use client";

import { NavBreadcrumb } from "@/framework/components/menu/NavBreadcrumb";
import { NavMenu } from "@/framework/components/menu/NavMenu";
import { resourceDescriptors } from "@/app/[locale]/cms/resourceDescriptors";
import { BASE_ROUTE } from "./constants";
import { useMenuItems } from "./MenuItems";

/** The framework's ☰ menu over this CMS's menu items. */
export function CmsNavMenu() {
  return <NavMenu sections={useMenuItems()} home={BASE_ROUTE} />;
}

/** The framework's breadcrumb over this CMS's menu items and resources. */
export function CmsNavBreadcrumb() {
  return <NavBreadcrumb sections={useMenuItems()} resources={resourceDescriptors} />;
}
