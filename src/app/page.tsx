"use client";
import { menuItems } from "@/components/MenuItems";
import GridMenu from "@/framework/components/menu/GridMenu";

export default function HomePage() {
  return <GridMenu menuItems={menuItems} />;
}
