"use client";

import { useEffect, useId, useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDownIcon, ChevronsDownUpIcon, ChevronsUpDownIcon, HomeIcon, MenuIcon } from "lucide-react";
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
import type { MenuLink, MenuSection } from "./types";

/** Where the collapsed sections and groups are remembered between visits. */
const STORAGE_KEY = "manifest-menu-collapsed";

const sectionKey = (section: MenuSection) => `s:${section.folder ?? section.module}`;
const groupKey = (section: MenuSection, name: string) => `g:${section.folder ?? section.module}/${name}`;

function readCollapsed(): Set<string> {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
  } catch {
    return new Set();
  }
}

/** A section or group heading that opens and closes what's under it. */
function ToggleHeading({
  label,
  expanded,
  controls,
  onToggle,
  variant,
}: {
  label: string;
  expanded: boolean;
  controls: string;
  onToggle: () => void;
  variant: "section" | "group";
}) {
  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onToggle}
      className={cn(
        "flex w-full items-center gap-1 rounded-md px-2 text-left text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        variant === "section" ? "h-7 text-xs font-medium tracking-wide uppercase" : "h-7 text-xs font-medium",
      )}
    >
      <span className="min-w-0 flex-1 truncate">{label}</span>
      <ChevronDownIcon aria-hidden className={cn("size-3.5 shrink-0 transition-transform", !expanded && "-rotate-90")} />
    </button>
  );
}

/**
 * The ☰ menu: every module and its screens (grouped where the module has groups); on phones also
 * language and theme. Sections and groups open and close (Expand all / Collapse all in the
 * header), remembered between visits; the ones holding the current page open with the menu.
 */
export function NavMenu({ sections, home }: { sections: MenuSection[]; home: string }) {
  const t = useTranslations("Menu");
  const tSite = useTranslations("Site");
  const pathname = usePathname();
  const baseId = useId();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());

  const isActive = (path: string) => pathname === path || pathname.startsWith(`${path}/`);

  const allKeys = sections.flatMap((section) => [
    sectionKey(section),
    ...(section.groups ?? []).map((group) => groupKey(section, group.name)),
  ]);

  const save = (next: Set<string>) => {
    setCollapsed(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // Private mode or storage full: it just isn't remembered.
    }
  };
  const toggle = (key: string) => {
    const next = new Set(collapsed);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    save(next);
  };

  // On opening: what was collapsed last time, except where the current page is.
  useEffect(() => {
    if (!open) return;
    const next = readCollapsed();
    for (const section of sections) {
      const groups = section.groups ?? [];
      const inGroup = groups.find((group) => group.links.some((link) => isActive(link.path)));
      if (inGroup || section.links.some((link) => isActive(link.path))) next.delete(sectionKey(section));
      if (inGroup) next.delete(groupKey(section, inGroup.name));
    }
    setCollapsed(next);
    // Only when the menu opens: later toggles are the user's.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const renderLink = (link: MenuLink) => {
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
  };

  const anyCollapsed = allKeys.some((key) => collapsed.has(key));
  const anyExpanded = allKeys.some((key) => !collapsed.has(key));

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
          <div className="flex items-center justify-end gap-1 border-b px-3 py-1.5">
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled={!anyCollapsed} onClick={() => save(new Set())}>
              <ChevronsUpDownIcon aria-hidden className="size-3.5" />
              {t("expandAll")}
            </Button>
            <Button type="button" variant="ghost" size="sm" className="h-8 px-2 text-xs" disabled={!anyExpanded} onClick={() => save(new Set(allKeys))}>
              <ChevronsDownUpIcon aria-hidden className="size-3.5" />
              {t("collapseAll")}
            </Button>
          </div>
          <nav aria-label={t("menu")} className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
            <Link
              href={home}
              onClick={() => setOpen(false)}
              aria-current={pathname === home ? "page" : undefined}
              // shrink-0: the scrolling column would otherwise squeeze this row when the menu is long.
              className="flex h-10 shrink-0 items-center gap-2 rounded-lg px-2 text-sm outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 aria-[current=page]:bg-selected aria-[current=page]:font-medium aria-[current=page]:text-link"
            >
              <HomeIcon className="size-4 text-muted-foreground" />
              {t("home")}
            </Link>
            {sections.map((section, sectionIndex) => {
              const sKey = sectionKey(section);
              const sectionOpen = !collapsed.has(sKey);
              const sectionId = `${baseId}-s${sectionIndex}`;
              return (
                <div key={sKey} className="grid shrink-0 gap-1">
                  <ToggleHeading
                    variant="section"
                    label={section.module}
                    expanded={sectionOpen}
                    controls={sectionId}
                    onToggle={() => toggle(sKey)}
                  />
                  <div id={sectionId} hidden={!sectionOpen} className="grid gap-1">
                    {section.links.map(renderLink)}
                    {section.groups?.map((group, groupIndex) => {
                      const gKey = groupKey(section, group.name);
                      const groupOpen = !collapsed.has(gKey);
                      const groupId = `${sectionId}-g${groupIndex}`;
                      return (
                        <div key={gKey} role="group" aria-label={group.name} className="mt-1 ml-2 grid gap-1 border-l pl-2">
                          <ToggleHeading
                            variant="group"
                            label={group.name}
                            expanded={groupOpen}
                            controls={groupId}
                            onToggle={() => toggle(gKey)}
                          />
                          <div id={groupId} hidden={!groupOpen} className="grid gap-1">
                            {group.links.map(renderLink)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
          {/* On phones the navbar has room only for the menu, Home, the title and the avatar. */}
          <div className="flex items-center gap-2 border-t p-3 sm:hidden">
            <LocaleSwitcher label={tSite("language")} />
            <ThemeSwitcher label={tSite("theme")} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
