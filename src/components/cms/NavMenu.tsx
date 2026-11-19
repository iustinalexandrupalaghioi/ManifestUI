"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { HomeIcon, MenuIcon } from "lucide-react";
import { Link, usePathname } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { LocaleSwitcher } from "@/framework/components/partials/LocaleSwitcher";
import { ThemeSwitcher } from "@/framework/components/partials/ThemeSwitcher";
import { cn } from "@/framework/lib/utils";
import { formatLiveNumber, LiveNumber } from "@/framework/components/menu/LiveNumber";
import { BASE_ROUTE } from "./constants";
import { useMenuItems } from "./MenuItems";

/** The ☰ menu: every module and its screens; on phones also language and theme. */
export function NavMenu() {
  const t = useTranslations("Menu");
  const tSite = useTranslations("Site");
  const sections = useMenuItems();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label={t("openMenu")}
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-72 gap-0 p-0">
          <SheetHeader className="border-b">
            <SheetTitle>{t("menu")}</SheetTitle>
          </SheetHeader>
          <nav aria-label={t("menu")} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto p-3">
            <Link
              href={BASE_ROUTE}
              onClick={() => setOpen(false)}
              aria-current={pathname === BASE_ROUTE ? "page" : undefined}
              className="flex h-10 items-center gap-2 rounded-lg px-2 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-selected aria-[current=page]:text-link"
            >
              <HomeIcon className="size-4 text-muted-foreground" />
              {t("home")}
            </Link>
            {sections.map((section) => (
              <div key={section.module} className="grid gap-1">
                <p className="px-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {section.module}
                </p>
                {section.links.map((link) => {
                  const Icon = link.icon;
                  const active = isActive(link.path);
                  return (
                    <Link
                      key={link.path}
                      href={link.path}
                      title={link.title}
                      onClick={() => setOpen(false)}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex h-10 items-center gap-2 rounded-lg px-2 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50",
                        active && "bg-selected font-medium text-link",
                      )}
                    >
                      <Icon className="size-4 text-muted-foreground" />
                      <span className="min-w-0 flex-1 truncate">{link.name}</span>
                      {link.type === "live" && (
                        <LiveNumber use={link.useLiveNumber}>
                          {(value) =>
                            value !== undefined && (
                              <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium tabular-nums text-muted-foreground">
                                {formatLiveNumber(value)}
                              </span>
                            )
                          }
                        </LiveNumber>
                      )}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          {/* On phones the navbar has room only for the menu, the title and the avatar. */}
          <div className="flex items-center gap-2 border-t p-3 sm:hidden">
            <LocaleSwitcher label={tSite("language")} />
            <ThemeSwitcher label={tSite("theme")} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
