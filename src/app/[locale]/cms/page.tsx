"use client";
import { useMenuItems } from "@/components/cms/MenuItems";
import GridMenu from "@/framework/components/menu/GridMenu";

export default function HomePage() {
  const menuItems = useMenuItems();
  return <GridMenu menuItems={menuItems} />;
}
